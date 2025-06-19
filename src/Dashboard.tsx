import React, { useState } from 'react';
import { useDatabase } from './useDatabase';
import type { Contact, Interaction } from './db';
import { annotateContacts } from './cadenceUtils';
import styles from './Dashboard.module.css';

function LoadingWidget({ label }: { label: string }) {
  return <div className={styles.widget}><div className={styles.loading}>Loading {label}…</div></div>;
}

export default function Dashboard({ onOverdueContactClick }: { onOverdueContactClick?: (contact: Contact) => void }) {
  const { getContacts, getInteractions } = useDatabase();
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [interactions, setInteractions] = React.useState<Interaction[]>([]);
  const [contactsLoading, setContactsLoading] = React.useState(true);
  const [interactionsLoading, setInteractionsLoading] = React.useState(true);

  React.useEffect(() => {
    const sub = getContacts().subscribe((c: Contact[]) => {
      setContacts(c);
      setContactsLoading(false);
    });
    return () => sub.unsubscribe();
  }, [getContacts]);

  React.useEffect(() => {
    const sub = getInteractions().subscribe((ints: Interaction[]) => {
      setInteractions(ints);
      setInteractionsLoading(false);
    });
    return () => sub.unsubscribe();
  }, [getInteractions]);

  // Annotate contacts for overdue
  const now = new Date();
  const annotated = annotateContacts(contacts, interactions, now);
  const overdue = annotated.filter(c => c.overdue);

  // Touches this month
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const touchesThisMonth = interactions.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  // Trend: compare to last month
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const touchesLastMonth = interactions.filter(i => {
    const d = new Date(i.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });
  const trend = touchesThisMonth.length - touchesLastMonth.length;

  // Recent 10 interactions
  const recentInteractions = [...interactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className={styles.dashboardGrid}>
      {/* Overdue Contacts Widget */}
      {contactsLoading || interactionsLoading ? (
        <LoadingWidget label="Overdue Contacts" />
      ) : (
        <div className={styles.widget}>
          <h3>Overdue Contacts</h3>
          {overdue.length === 0 ? (
            <div className={styles.empty}>No overdue contacts 🎉</div>
          ) : (
            <ul className={styles.list}>
              {overdue.slice(0, 8).map(c => (
                <li key={c.id}>
                  <button className={styles.link} onClick={() => onOverdueContactClick?.(c)} title="Show contact details">
                    {c.name} <span className={styles.daysOverdue}>{c.daysOverdue}d overdue</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Touches This Month Widget */}
      {interactionsLoading ? (
        <LoadingWidget label="Touches This Month" />
      ) : (
        <div className={styles.widget}>
          <h3>Touches This Month</h3>
          <div className={styles.touchesCount}>{touchesThisMonth.length}</div>
          <div className={trend > 0 ? styles.trendUp : trend < 0 ? styles.trendDown : styles.trendFlat}>
            {trend > 0 ? '▲' : trend < 0 ? '▼' : '–'} {Math.abs(trend)} vs last month
          </div>
        </div>
      )}

      {/* Recent Interactions Widget */}
      {interactionsLoading ? (
        <LoadingWidget label="Recent Interactions" />
      ) : (
        <div className={styles.widget}>
          <h3>Recent Interactions</h3>
          {recentInteractions.length === 0 ? (
            <div className={styles.empty}>No recent interactions</div>
          ) : (
            <ul className={styles.list}>
              {recentInteractions.map(i => (
                <li key={i.id}>
                  <span className={styles.interactionDate}>{new Date(i.date).toLocaleDateString()}</span>
                  <span className={styles.interactionName}>{contacts.find(c => c.id === i.contactId)?.name || 'Unknown'}</span>
                  <span className={styles.interactionChannel}>{i.channel}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
