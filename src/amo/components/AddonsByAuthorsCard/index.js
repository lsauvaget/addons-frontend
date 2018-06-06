/* @flow */
import makeClassName from 'classnames';
import deepEqual from 'deep-eql';
import invariant from 'invariant';
import * as React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import AddonsCard from 'amo/components/AddonsCard';
import Link from 'amo/components/Link';
import {
  fetchAddonsByAuthors,
  getAddonsForUsernames,
  getCountForAuthorNames,
  getLoadingForAuthorNames,
} from 'amo/reducers/addonsByAuthors';
import Paginate from 'core/components/Paginate';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES,
  SEARCH_SORT_POPULAR,
} from 'core/constants';
import { withErrorHandler } from 'core/errorHandler';
import translate from 'core/i18n/translate';
import type { AddonsByAuthorsState } from 'amo/reducers/addonsByAuthors';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocation } from 'core/types/router';

import './styles.scss';


type Props = {|
  addonType?: string,
  addons?: Array<AddonType>,
  authorDisplayName: string,
  authorUsernames: Array<string>,
  className?: string,
  count: number | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  forAddonSlug?: string,
  i18n: I18nType,
  loading: boolean,
  location: ReactRouterLocation,
  numberOfAddons: number,
  pageParam: string,
  paginate: boolean,
  pathname?: string,
  showMore?: boolean,

  // AddonCards prop this component also accepts
  showSummary?: boolean,
  type?: 'horizontal' | 'vertical',
|};

export class AddonsByAuthorsCardBase extends React.Component<Props> {
  static defaultProps = {
    pageParam: 'page',
    paginate: false,
    showMore: true,
    showSummary: false,
    type: 'horizontal',
  }

  componentWillMount() {
    const {
      addonType,
      authorUsernames,
      forAddonSlug,
      location,
      pageParam,
    } = this.props;

    this.dispatchFetchAddonsByAuthors({
      addonType,
      authorUsernames,
      forAddonSlug,
      page: this.getCurrentPage({ location, pageParam }),
    });
  }

  componentWillReceiveProps({
    addonType: newAddonType,
    authorUsernames: newAuthorNames,
    forAddonSlug: newForAddonSlug,
    location: newLocation,
    pageParam,
    paginate,
  }: Props) {
    const {
      addonType: oldAddonType,
      authorUsernames: oldAuthorNames,
      forAddonSlug: oldForAddonSlug,
      location: oldLocation,
    } = this.props;

    let newPage = false;
    if (paginate) {
      newPage = oldLocation.query[pageParam] !== newLocation.query[pageParam];
    }

    if (
      oldAddonType !== newAddonType ||
      oldForAddonSlug !== newForAddonSlug ||
      !deepEqual(oldAuthorNames, newAuthorNames) ||
      newPage
    ) {
      this.dispatchFetchAddonsByAuthors({
        addonType: newAddonType,
        authorUsernames: newAuthorNames,
        forAddonSlug: newForAddonSlug,
        page: this.getCurrentPage({ location: newLocation, pageParam }),
      });
    }
  }

  getCurrentPage({ location, pageParam }: Object) {
    const currentPage = parseInt(location.query[pageParam], 10);

    return Number.isNaN(currentPage) || currentPage < 1 ? 1 : currentPage;
  }

  dispatchFetchAddonsByAuthors({
    addonType,
    authorUsernames,
    forAddonSlug,
    page,
  }: Object) {
    const { errorHandler, numberOfAddons, paginate } = this.props;

    const filtersForPagination = {};

    if (paginate) {
      invariant(page, 'page is required when paginate is `true`.');

      filtersForPagination.page = page;
      filtersForPagination.sort = SEARCH_SORT_POPULAR;
    }

    this.props.dispatch(fetchAddonsByAuthors({
      addonType,
      authorUsernames,
      errorHandlerId: errorHandler.id,
      forAddonSlug,
      pageSize: numberOfAddons,
      ...filtersForPagination,
    }));
  }

  render() {
    const {
      addonType,
      addons,
      authorDisplayName,
      authorUsernames,
      className,
      i18n,
      loading,
      numberOfAddons,
      paginate,
      showMore,
      showSummary,
      type,
    } = this.props;

    if (!loading && (!addons || !addons.length)) {
      return null;
    }

    let header;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More dictionaries by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More dictionaries by these translators'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Dictionaries by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Dictionaries by these translators'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_EXTENSION:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More extensions by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More extensions by these developers'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Extensions by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Extensions by these developers'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_LANG:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More language packs by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More language packs by these translators'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Language packs by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Language packs by these translators'),
          authorUsernames.length
        );
        break;
      case ADDON_TYPE_STATIC_THEME:
      case ADDON_TYPE_THEME:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More themes by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More themes by these artists'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Themes by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Themes by these artists'),
          authorUsernames.length
        );
        break;
      default:
        header = showMore ? i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More add-ons by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('More add-ons by these developers'),
          authorUsernames.length
        ) : i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('Add-ons by %(author)s'),
            { author: authorDisplayName }
          ),
          i18n.gettext('Add-ons by these developers'),
          authorUsernames.length
        );
    }

    const classnames = makeClassName('AddonsByAuthorsCard', className, {
      'AddonsByAuthorsCard--theme': ADDON_TYPE_THEMES.includes(addonType),
    });

    let paginator = null;

    if (paginate) {
      const { count, location, pageParam, pathname } = this.props;

      invariant(pathname, 'pathname is required when paginate is `true`.');

      paginator = (count && count > numberOfAddons) ? (
        <Paginate
          LinkComponent={Link}
          count={count}
          currentPage={this.getCurrentPage({ location, pageParam })}
          pathname={pathname}
        />
      ) : null;
    }

    return (
      <AddonsCard
        addons={addons}
        className={classnames}
        footer={paginator}
        header={header}
        loading={loading}
        placeholderCount={numberOfAddons}
        showMetadata
        showSummary={showSummary}
        type={type}
      />
    );
  }
}

export const mapStateToProps = (
  state: {| addonsByAuthors: AddonsByAuthorsState |}, ownProps: Props
) => {
  const { addonType, authorUsernames, forAddonSlug, numberOfAddons } = ownProps;

  let addons = getAddonsForUsernames(
    state.addonsByAuthors,
    authorUsernames,
    addonType,
    forAddonSlug
  );
  addons = addons ? addons.slice(0, numberOfAddons) : addons;

  const count = getCountForAuthorNames(
    state.addonsByAuthors,
    authorUsernames,
    addonType
  );

  const loading = getLoadingForAuthorNames(
    state.addonsByAuthors,
    authorUsernames,
    addonType
  );

  return {
    addons,
    count,
    loading,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
  withErrorHandler({ name: 'AddonsByAuthorsCard' }),
  withRouter,
)(AddonsByAuthorsCardBase);
