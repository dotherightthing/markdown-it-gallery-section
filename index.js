/**
 * @file index.js
 * @summary markdown-it-gallery-section
 * @description A markdown-it plugin for wrapping a sequence of images with a tag or custom Vue component.
 */

class GalleryPlugin {
    constructor(md, options) {
        this.md = md;
        this.options = Object.assign({
            contentWrapperClass: 'entry-content',
            contentWrapperTag: 'div',
            galleryClass: '',
            galleryTag: 'Gallery',
            headingLevel: 'h2',
            sectionClass: '', 
            sectionTag: 'ContentSection'
        }, options);

        md.core.ruler.after('inline', 'gallery', this.gallery.bind(this));

        this.log = [];
    }

    /**
     * @function arrayToAttrString
     * @param {Array} arr
     * @returns {String} arrStr
     * @see {@link https://stackoverflow.com/a/64049986}
     */
    arrayToAttrString(arr) {
        let arrStr = JSON.stringify(arr);

        arrStr = arrStr.replace(/"([^"]+)":/g, '$1:'); // unquote property keys
        arrStr = arrStr.replaceAll("'", "\'"); // escape single quotes in content
        arrStr = arrStr.replaceAll("\"", "'"); // use single quotes around property values

        return arrStr;
    }

    /**
     * @function createContentWrapperTokens
     * @param {Object} state
     * @param {Number} level
     * @returns {Array} [contentWrapperTokenOpen, contentWrapperTokenClose]
     */
    createContentWrapperTokens(state, level) {
        const {
            contentWrapperClass,
            contentWrapperTag,
        } = this.options;

        const contentWrapperTokenOpen = new state.Token('html_block', '', level);
        const contentWrapperTokenClose = new state.Token('html_block', '', level);

        contentWrapperTokenOpen.content = `<${contentWrapperTag} class="${contentWrapperClass}">`;
        contentWrapperTokenClose.content = `</${contentWrapperTag}>`;

        return [contentWrapperTokenOpen, contentWrapperTokenClose];
    }

    /**
     * @function createGalleryTokens
     * @param {Object} state
     * @param {Number} level
     * @param {Object} gallery
     * @param {Number} index
     * @returns {Array} [galleryTokenOpen, galleryTokenClose]
     * @see {@link https://tedclancy.wordpress.com/2015/06/03/which-unicode-character-should-represent-the-english-apostrophe-and-why-the-unicode-committee-is-very-wrong/}
     * @see {@link https://unicodeplus.com/U+02BC}
     * @see {@link https://thesynack.com/posts/markdown-captions/} - Hijacking alt or title attributes
     */
    createGalleryTokens(state, level, gallery, index) {
        const {
            galleryClass,
            galleryTag,
        } = this.options;

        const {
            childImageTokens
        } = gallery;

        const galleryTokenOpen = new state.Token('html_block', '', level); // tag, type, nesting
        const galleryTokenClose = new state.Token('html_block', '', level);
        
        const childImageTokensObj = childImageTokens.map((token, key) => {
            return {
                alt: token.content.replaceAll('\'', 'ʼ'),
                caption: token.attrGet('title').replaceAll('\'', 'ʼ'),
                id: key,
                src: token.attrGet('src'),
            } 
        });

        const galleryImagesAttrStr = this.arrayToAttrString(childImageTokensObj);

        galleryTokenOpen.content = `<${galleryTag} class="${galleryClass}" id="${index}" :images="${galleryImagesAttrStr}">`;
        galleryTokenClose.content = `</${galleryTag}>`;

        return [galleryTokenOpen, galleryTokenClose];
    }

    /**
     * @function createSectionTokens
     * @param {Object} state
     * @param {Number} level
     * @param {Object} gallery
     * @returns {Array} [sectionTokenOpen, sectionTokenClose]
     */
    createSectionTokens(state, level, gallery) {
        const {
            sectionClass,
            sectionTag,
        } = this.options;

        const {
            headingContentToken
        } = gallery;

        const sectionTokenOpen = new state.Token('html_block', '', level); // tag, type, nesting
        const sectionTokenClose = new state.Token('html_block', '', level);

        sectionTokenOpen.content = `<${sectionTag} class="${sectionClass}" headingContent="${headingContentToken.content}">`;
        sectionTokenClose.content = `</${sectionTag}>`;

        return [sectionTokenOpen, sectionTokenClose];
    }

    /**
     * @function insertTokenAfter
     * @param {Object} state
     * @param {Object} oldToken
     * @param {Object} newToken
     */
    insertTokenAfter(state, oldToken, newToken) {
        const insertPosition = state.tokens.indexOf(oldToken) + 1;

        state.tokens.splice(insertPosition, 0, newToken);
    }

    /**
     * @function insertTokenBefore
     * @param {Object} state
     * @param {Object} oldToken
     * @param {Object} newToken
     */
    insertTokenBefore(state, oldToken, newToken) {
        const insertPosition = state.tokens.indexOf(oldToken);

        state.tokens.splice(insertPosition, 0, newToken);
    }

    /**
     * @function gallery
     * @param {Object} state
     */
    gallery(state) {
        const {
            headingLevel,
        } = this.options;

        const tokens = state.tokens;
        const galleries = [];

        tokens.forEach((token, index) => {
            if ((token.type === 'heading_open') && (token.tag === headingLevel)) {
                // gallery styles are also applied to non-gallery headings
                const gallery = {
                    childImageTokens: [],
                    headingOpenToken: token,
                    headingContentToken: tokens[index + 1],
                    headingCloseToken: tokens[index + 2],
                    hideTokens: [],
                };

                if (tokens[index + 3].type === 'paragraph_open') {
                    if (tokens[index + 4].type === 'inline') {
                        const childTokens = tokens[index + 4].children;

                        if (childTokens.length) {
                            gallery.childImageTokens = childTokens.filter(child => child.type === 'image');

                            if (gallery.childImageTokens.length) {
                                gallery.hideTokens.push(tokens[index + 3]);
                                gallery.hideTokens.push(tokens[index + 4]);

                                tokens[index + 4].children.forEach(child => {
                                    gallery.hideTokens.push(child);
                                });
                            }
                        }
                    }
                }

                galleries.push(gallery);
            }
        });

        galleries.forEach((gallery, index) => {
            const {
                headingOpenToken,
                headingCloseToken,
                hideTokens, // TODO: there's still an empty P after the injected gallery (hidden via CSS)
            } = gallery;

            const prevIndex = index - 1;
            const nextIndex = index + 1;

            const contentLevel = 0; // headingOpenToken.level;

            const galleryTokens = this.createGalleryTokens(state, (contentLevel - 1), gallery, index);
            const contentWrapperTokens = this.createContentWrapperTokens(state, (contentLevel - 1), gallery);

            const firstGallery = !(prevIndex in galleries);
            const lastGallery = !(nextIndex in galleries);

            // 0. Hide original elements

            hideTokens.forEach(hideToken => {
                hideToken.hidden = true;
            });

            // 1. wrap gallery around headingLevel

            this.insertTokenBefore(state, headingOpenToken, galleryTokens[0]);
            this.insertTokenAfter(state, headingCloseToken, galleryTokens[1]);

            if (!firstGallery) {
                // insert end tag (of previous wrapper) before gallery open token
                this.insertTokenBefore(state, galleryTokens[0], contentWrapperTokens[1]);
            }

            // 2. wrap contentWrapper around content after gallery

            // insert start tag (of this wrapper) after gallery close token
            this.insertTokenAfter(state, galleryTokens[1], contentWrapperTokens[0]);

            if (firstGallery && !lastGallery) {
                const nextGallery = galleries[nextIndex];

                // insert end tag (of this wrapper) before next heading open token (unprocessed gallery)
                this.insertTokenBefore(state, nextGallery.headingOpenToken, contentWrapperTokens[1]);
            }
            
            if (lastGallery) {
                // insert end tag (of this wrapper) after last token
                state.tokens.push(contentWrapperTokens[1]);
            }
        });

        const contentLevel = 0; // TODO
        let galleryIndex = 0;
        let sectionTokens = null;

        const injectedGalleryTokens = state.tokens.filter(t => {
            const { galleryTag } = this.options;
            const re = new RegExp(`<${galleryTag}`);

            return ((t.type === 'html_block') && (t.content.match(re)));
        });

        injectedGalleryTokens.forEach(t => {
            const gallery = galleries[galleryIndex];

            if (typeof gallery !== 'undefined') {
                sectionTokens = this.createSectionTokens(state, (contentLevel - 2), gallery);

                // 3. wrap section around gallery and contentWrapper

                if (galleryIndex === 0) {
                    this.insertTokenBefore(state, t, sectionTokens[0]); // open
                } else {
                    this.insertTokenBefore(state, t, sectionTokens[1]); // close
                    this.insertTokenBefore(state, t, sectionTokens[0]); // open
                }

                galleryIndex += 1;
            }
        });

        if (sectionTokens) {
            state.tokens.push(sectionTokens[1]); // close
        }
    }
}

module.exports = (md, options = {}) => new GalleryPlugin(md, options);
