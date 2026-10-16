import type {ReactElement} from 'react';

const ICONS = '/icons';
const ASSIST = '/assistant';

export default function OpportunitiesPage(): ReactElement {
  return (
    <div className="proto-card opp-app">
      <header className="opp-app__header">
        <h1>Opportunities</h1>
      </header>
      <div className="opp-app__body">
        <aside className="opp-app__list">
          <h2>Your Opportunities</h2>
          <div className="opp-app__menu">
            <div className="opp-app__item is-selected">
              <img src={`${ICONS}/lucide-bell-ring.svg`} width={16} height={16} alt="" />
              <span>Thermal Protection Systems</span>
              <span className="opp-app__sample">Sample</span>
            </div>
            <button className="opp-app__add" type="button">
              <img src={`${ASSIST}/plus.svg`} width={16} height={16} alt="" />
              Add more
            </button>
          </div>
        </aside>
        <section className="opp-app__workspace">
          <header className="opp-app__workspace-head">
            <div className="opp-app__title">
              <h2>Thermal Protection Systems for Reentry Vehicles</h2>
            </div>
            <div className="opp-app__actions">
              <button type="button">
                <img src={`${ICONS}/lucide-settings-2.svg`} width={16} height={16} alt="" />
                Configure
              </button>
              <button type="button">
                <img src={`${ICONS}/lucide-share-2.svg`} width={16} height={16} alt="" />
                Share
              </button>
            </div>
          </header>
          <div className="opp-app__table" role="table">
            <div className="opp-app__row opp-app__row--head" role="row">
              <div role="columnheader">Documents</div>
              <div role="columnheader">Status</div>
              <div role="columnheader">
                Updated
                <img src={`${ICONS}/lucide-arrow-down-up.svg`} width={16} height={16} alt="" />
              </div>
            </div>
            <div className="opp-app__row" role="row">
              <div className="opp-app__doc" role="cell">
                <img src={`${ICONS}/lucide-file-text.svg`} width={16} height={16} alt="" />
                <div>
                  <p>Opportunity brief - AFRL · Aerospace Systems Directorate</p>
                  <p>Created from your walkthrough</p>
                </div>
              </div>
              <div className="opp-app__status" role="cell">
                Ready
              </div>
              <div className="opp-app__updated" role="cell">
                a few secs ago
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
