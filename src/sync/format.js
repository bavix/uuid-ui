'use strict';

const CLASSIC = /^ghp_[A-Za-z0-9]{20,}$/;
const FINE_GRAINED = /^github_pat_[A-Za-z0-9_]{20,}$/;

export function ago(at) {
    if (!at) {
        return 'never';
    }

    const seconds = Math.max(1, Math.round((Date.now() - at) / 1000));

    if (seconds < 60) {
        return `${seconds}s ago`;
    }

    if (seconds < 3600) {
        return `${Math.round(seconds / 60)} min ago`;
    }

    if (seconds < 86400) {
        return `${Math.round(seconds / 3600)} h ago`;
    }

    return `${Math.round(seconds / 86400)} d ago`;
}

export function expiryOf(text, now = Date.now()) {
    if (!text) {
        return null;
    }

    const at = Date.parse(text);

    if (!Number.isFinite(at)) {
        return null;
    }

    const days = Math.floor((at - now) / 86_400_000);

    if (days < 0) {
        return { tone: 'is-warn', text: 'expired' };
    }

    if (days === 0) {
        return { tone: 'is-warn', text: 'expires today' };
    }

    if (days <= 7) {
        return { tone: 'is-warn', text: `expires in ${days} ${days === 1 ? 'day' : 'days'}` };
    }

    return { tone: '', text: `expires in ${days} days` };
}

export function countOf(summary) {
    const parts = [];

    if (summary.added) {
        parts.push(`+${summary.added} rows`);
    }

    if (summary.removed) {
        parts.push(`${summary.removed} removed`);
    }

    if (summary.tags) {
        parts.push(`+${summary.tags} tags`);
    }

    return parts.join(' · ') || 'nothing changed';
}

export function verdictOf(value) {
    const token = (value || '').trim();

    if (token === '') {
        return { tone: '', text: '' };
    }

    if (FINE_GRAINED.test(token)) {
        return { tone: 'is-good', text: 'Fine-grained token.' };
    }

    if (CLASSIC.test(token)) {
        return { tone: 'is-good', text: 'Classic token.' };
    }

    if (/\s/.test(token)) {
        return { tone: 'is-bad', text: 'There is whitespace in it — paste the token alone.' };
    }

    return { tone: '', text: 'Unfamiliar shape — Connect will tell.' };
}
