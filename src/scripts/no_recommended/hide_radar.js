import { pageModifications } from '../../util/mutations.js';
import { translate } from '../../util/language_data.js';
import { buildStyle } from '../../util/interface.js';

const hiddenClass = 'xkit-no-recommended-radar-hidden';

const styleElement = buildStyle(`.${hiddenClass} { display: none; }`);

const checkForRadar = function (sidebarTitles) {
  sidebarTitles
    .filter(h1 => h1.textContent === translate('Radar'))
    .forEach(h1 => h1.parentNode.classList.add(hiddenClass));
};

export const main = async function () {
  pageModifications.register('aside > div > h1', checkForRadar);
  document.documentElement.append(styleElement);
};

export const clean = async function () {
  pageModifications.unregister(checkForRadar);
  styleElement.remove();
  $(`.${hiddenClass}`).removeClass(hiddenClass);
};
