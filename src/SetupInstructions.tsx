import React from 'react';
import styles from './SetupInstructions.module.css';

const browserInstructions = [
  {
    name: 'Chrome',
    bookmark: 'Press Ctrl+D (Windows) or Cmd+D (Mac) to bookmark this page.',
    homepage: 'Go to Settings > On startup > Open a specific page or set of pages > Add a new page and enter this URL.'
  },
  {
    name: 'Firefox',
    bookmark: 'Press Ctrl+D (Windows) or Cmd+D (Mac) to bookmark this page.',
    homepage: 'Go to Settings > Home > New Windows and Tabs > Homepage and new windows > Custom URLs and enter this URL.'
  },
  {
    name: 'Safari',
    bookmark: 'Press Cmd+D to bookmark this page.',
    homepage: 'Go to Safari > Preferences > General > Homepage and enter this URL. Then click Set to Current Page.'
  }
];

function getBrowser() {
  const ua = navigator.userAgent;
  if (/chrome|crios|crmo/i.test(ua) && !/edge|edg|opr|opera/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua) && !/chrome|crios|crmo|edge|edg|opr|opera/i.test(ua)) return 'Safari';
  return '';
}

export default function SetupInstructions() {
  const [show, setShow] = React.useState(false);
  React.useEffect(() => {
    if (!localStorage.getItem('cultivate-setup-shown')) {
      setShow(true);
      localStorage.setItem('cultivate-setup-shown', '1');
    }
  }, []);
  if (!show) return null;
  const browser = getBrowser();
  return (
    <div className={styles.instructions}>
      <h2>Welcome! Set Up Cultivate for Easy Access</h2>
      <ul>
        <li><strong>Bookmark this app:</strong> {browserInstructions.find(b => b.name === browser)?.bookmark || 'Press Ctrl+D (Windows) or Cmd+D (Mac) to bookmark.'}</li>
        <li><strong>Set as your browser homepage:</strong> {browserInstructions.find(b => b.name === browser)?.homepage || 'See your browser settings to set this page as your homepage.'}</li>
      </ul>
      <details style={{marginTop: 16}}>
        <summary>Browser-specific instructions</summary>
        <ul>
          {browserInstructions.map(b => (
            <li key={b.name}>
              <strong>{b.name}:</strong>
              <ul>
                <li>Bookmark: {b.bookmark}</li>
                <li>Homepage: {b.homepage}</li>
              </ul>
            </li>
          ))}
        </ul>
      </details>
      <button className={styles.closeBtn} onClick={() => setShow(false)}>Dismiss</button>
    </div>
  );
}
