import { addStyle, removeStyle, getPostElements, registerMeatballItem, unregisterMeatballItem } from '../util/interface.js';
import { onNewPosts, onBaseContainerMutated } from '../util/mutations.js';
import { inject } from '../util/inject.js';

const storageKey = 'notificationblock.blockedPostTargetIDs';
const excludeClass = 'xkit-notificationblock-done';
const actionableClass = 'xkit-notificationblock-actionable';
const meatballButtonLabel = 'NotificationBlock';

let css;

const buildStyles = blockedPostTargetIDs => blockedPostTargetIDs.map(id => `[data-target-post-id="${id}"]`).join(', ').concat(' { display: none; }');

const processPosts = () => {
  getPostElements({ excludeClass })
    .filter(postElement => postElement.querySelector('footer a[href*="/edit/"]') !== null)
    .forEach(postElement => postElement.classList.add(actionableClass));
};

const processNotifications = () => inject(async () => {
  const cssMap = await window.tumblr.getCssMap();
  const notificationSelector = cssMap.notification.map(className => `.${className}:not([data-target-post-id])`).join(', ');

  [...document.querySelectorAll(notificationSelector)].forEach(async notificationElement => {
    const reactKey = Object.keys(notificationElement).find(key => key.startsWith('__reactInternalInstance'));
    let fiber = notificationElement[reactKey];
    let tries = 0;

    while (fiber.memoizedProps.notification === undefined && tries <= 10) {
      fiber = fiber.return;
      tries++;
    }

    if (!fiber || !fiber.memoizedProps.notification) { return; }

    const { targetPostId } = fiber.memoizedProps.notification;
    Object.assign(notificationElement.dataset, { targetPostId });
  });
});

const onButtonClicked = async function ({ currentTarget }) {
  const postElement = currentTarget.closest('[data-id]');
  const { id } = postElement.dataset;

  const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);

  if (blockedPostTargetIDs.includes(id)) {
    if (window.confirm('This post\'s notifications are blocked. Unblock this post\'s notifications?')) {
      await browser.storage.local.set({ [storageKey]: blockedPostTargetIDs.filter(blockedId => blockedId !== id) });
    }
  } else {
    if (window.confirm('Block this post\'s notifications?')) {
      blockedPostTargetIDs.push(id);
      await browser.storage.local.set({ [storageKey]: blockedPostTargetIDs });
    }
  }
};

export const onStorageChanged = (changes, areaName) => {
  if (areaName === 'local' && Object.keys(changes).includes(storageKey)) {
    removeStyle(css);
    css = buildStyles(changes[storageKey].newValue);
    addStyle(css);
  }
};

export const main = async function () {
  const { [storageKey]: blockedPostTargetIDs = [] } = await browser.storage.local.get(storageKey);
  css = buildStyles(blockedPostTargetIDs);
  addStyle(css);

  onNewPosts.addListener(processPosts);
  processPosts();
  onBaseContainerMutated.addListener(processNotifications);
  processNotifications();

  registerMeatballItem(meatballButtonLabel, onButtonClicked);
};

export const clean = async function () {
  removeStyle(css);
  onBaseContainerMutated.removeListener(processNotifications);
  unregisterMeatballItem(meatballButtonLabel);

  $(`.${excludeClass}`)
    .removeClass(excludeClass)
    .removeClass(actionableClass);
};

export const stylesheet = true;