/**
 * templates/index.js — Barrel export tất cả built-in templates
 */
import landingPage  from './landing-page.js';
import portfolio    from './portfolio.js';
import blogPost     from './blog-post.js';
import restaurant   from './restaurant.js';
import pricing      from './pricing.js';
import comingSoon   from './coming-soon.js';

/** @type {BuiltinTemplate[]} */
export const BUILTIN_TEMPLATES = [
    landingPage,
    portfolio,
    blogPost,
    restaurant,
    pricing,
    comingSoon
];

export const CATEGORIES = [
    { id: 'all',       label: 'All' },
    { id: 'landing',   label: 'Landing' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'blog',      label: 'Blog' },
    { id: 'business',  label: 'Business' }
];

/**
 * @typedef {Object} BuiltinTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {string} description
 * @property {number} pages
 * @property {string} thumbnail  - data URL
 * @property {Array}  pages_data - array of page objects compatible with PageManager.loadPages()
 */
