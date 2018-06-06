/* @flow */
import deepcopy from 'deepcopy';
import invariant from 'invariant';

import { ADDON_TYPE_THEME } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import type {
  ExternalAddonType,
  SearchResultAddonType,
} from 'core/types/addons';


type AddonId = number;

export type AddonsByAuthorsState = {|
  // TODO: It might be nice to eventually stop storing add-ons in this
  // reducer at all and rely on the add-ons in the `addons` reducer.
  // That said, these are partial add-ons returned from the search
  // results and fetching all add-on data for each add-on might be too
  // expensive.
  byAddonId: { [AddonId]: SearchResultAddonType },
  byAddonSlug: { [string]: Array<AddonId> },
  byAuthorNamesAndAddonType: { [string]: Array<AddonId> | null },
  byUserId: { [number]: Array<AddonId> },
  byUsername: { [string]: Array<AddonId> },
  countFor: { [string]: number },
  loadingFor: { [string]: boolean },
|};

export const initialState: AddonsByAuthorsState = {
  byAddonId: {},
  byAddonSlug: {},
  byAuthorNamesAndAddonType: {},
  byUserId: {},
  byUsername: {},
  countFor: {},
  loadingFor: {},
};

export const EXTENSIONS_BY_AUTHORS_PAGE_SIZE = 10;
export const THEMES_BY_AUTHORS_PAGE_SIZE = 12;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_ADDONS_BY_AUTHORS: 'FETCH_ADDONS_BY_AUTHORS'
  = 'FETCH_ADDONS_BY_AUTHORS';
export const LOAD_ADDONS_BY_AUTHORS: 'LOAD_ADDONS_BY_AUTHORS'
  = 'LOAD_ADDONS_BY_AUTHORS';

type FetchAddonsByAuthorsParams = {|
  addonType?: string,
  authorUsernames: Array<string>,
  errorHandlerId: string,
  forAddonSlug?: string,
  page?: number,
  pageSize: number,
  sort?: string,
|};

type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = ({
  addonType,
  authorUsernames,
  errorHandlerId,
  forAddonSlug,
  page,
  pageSize,
  sort,
}: FetchAddonsByAuthorsParams): FetchAddonsByAuthorsAction => {
  invariant(errorHandlerId, 'An errorHandlerId is required');
  invariant(authorUsernames, 'authorUsernames are required.');
  invariant(Array.isArray(authorUsernames),
    'The authorUsernames parameter must be an array.');
  invariant(pageSize, 'pageSize are required.');

  return {
    type: FETCH_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authorUsernames,
      errorHandlerId,
      forAddonSlug,
      page,
      pageSize,
      sort,
    },
  };
};

type LoadAddonsByAuthorsParams = {|
  addonType?: string,
  addons: Array<ExternalAddonType>,
  authorUsernames: Array<string>,
  count: number,
  forAddonSlug?: string,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = ({
  addonType,
  addons,
  authorUsernames,
  count,
  forAddonSlug,
}: LoadAddonsByAuthorsParams): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');
  invariant(authorUsernames, 'A list of authorUsernames is required.');
  invariant(count, 'count is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: {
      addons,
      addonType,
      authorUsernames,
      count,
      forAddonSlug,
    },
  };
};

export const joinAuthorNamesAndAddonType = (
  authorUsernames: Array<string>, addonType?: string
) => {
  return authorUsernames.sort().join('-') + (addonType ? `-${addonType}` : '');
};

export const getLoadingForAuthorNames = (
  state: AddonsByAuthorsState,
  authorUsernames: Array<string>,
  addonType?: string
): boolean => {
  return (
    state.loadingFor[joinAuthorNamesAndAddonType(authorUsernames, addonType)] ||
    false
  );
};

export const getCountForAuthorNames = (
  state: AddonsByAuthorsState, authorUsernames: Array<string>, addonType?: string
) => {
  return (
    state.countFor[joinAuthorNamesAndAddonType(authorUsernames, addonType)] ||
    null
  );
};

export const getAddonsForSlug = (
  state: AddonsByAuthorsState,
  slug: string,
): Array<SearchResultAddonType> | null => {
  const ids = state.byAddonSlug[slug];

  return ids ? ids.map((id) => {
    return state.byAddonId[id];
  }) : null;
};

export const getAddonsForUsernames = (
  state: AddonsByAuthorsState,
  usernames: Array<string>,
  addonType?: string,
  excludeSlug?: string,
): Array<SearchResultAddonType> | null => {
  invariant(usernames && usernames.length, 'At least one username is required');

  const ids = usernames.map((username) => {
    return state.byUsername[username];
  }).reduce((array, addonIds) => {
    if (addonIds) {
      for (const addonId of addonIds) {
        if (!array.includes(addonId)) {
          array.push(addonId);
        }
      }
    }

    return array;
  }, []);

  return ids.length ? (ids
    .map((id) => {
      return state.byAddonId[id];
    })
    .filter((addon) => {
      return addonType ? addon.type === addonType : true;
    })
    .filter((addon) => {
      return addon.slug !== excludeSlug;
    })
  ) : null;
};

type Action =
  | FetchAddonsByAuthorsAction
  | LoadAddonsByAuthorsAction;

const reducer = (
  state: AddonsByAuthorsState = initialState,
  action: Action
): AddonsByAuthorsState => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      if (action.payload.forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [action.payload.forAddonSlug]: undefined,
        };
      }

      newState.loadingFor[joinAuthorNamesAndAddonType(
        action.payload.authorUsernames, action.payload.addonType)] = true;
      newState.byAuthorNamesAndAddonType[joinAuthorNamesAndAddonType(
        action.payload.authorUsernames, action.payload.addonType)] = null;

      return newState;
    }
    case LOAD_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);
      const pageSize = action.payload.addonType === ADDON_TYPE_THEME ?
        THEMES_BY_AUTHORS_PAGE_SIZE : EXTENSIONS_BY_AUTHORS_PAGE_SIZE;

      if (action.payload.forAddonSlug) {
        newState.byAddonSlug = {
          [action.payload.forAddonSlug]: action.payload.addons
            .slice(0, pageSize)
            .map((addon) => addon.id),
        };
      }

      const addons = action.payload.addons
        .map((addon) => createInternalAddon(addon));

      const authorNamesWithAddonType = joinAuthorNamesAndAddonType(
        action.payload.authorUsernames,
        action.payload.addonType
      );

      newState.byAuthorNamesAndAddonType[authorNamesWithAddonType] = [];
      newState.countFor[authorNamesWithAddonType] = action.payload.count;
      newState.loadingFor[authorNamesWithAddonType] = false;

      for (const addon of addons) {
        newState.byAddonId[addon.id] = addon;
        newState.byAuthorNamesAndAddonType[authorNamesWithAddonType]
          .push(addon.id);

        if (addon.authors) {
          for (const author of addon.authors) {
            if (!newState.byUserId[author.id]) {
              newState.byUserId[author.id] = [];
            }
            if (!newState.byUsername[author.username]) {
              newState.byUsername[author.username] = [];
            }

            if (!newState.byUserId[author.id].includes(addon.id)) {
              newState.byUserId[author.id].push(addon.id);
            }

            if (!newState.byUsername[author.username].includes(addon.id)) {
              newState.byUsername[author.username].push(addon.id);
            }
          }
        }
      }

      return newState;
    }
    default:
      return state;
  }
};

export default reducer;
