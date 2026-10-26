import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';

import AllProjectsApp from './AllProjectsApp';
import './product-tokens.css';
import './tokens.css';
import './prototype.css';
import './assistant.css';
import './opportunities.css';
import './update-dialog.css';
import './discovery-v1.css';
import './discovery-v2.css';
import './discovery-v3.css';
import './horizon-scanning.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AllProjectsApp />
  </StrictMode>,
);
