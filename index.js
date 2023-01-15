/**
 * @file index.js
 * @summary markdown-it-vuepress-gallery, based on markdown-it-gallery
 * @description A markdown-it plugin for wrapping a sequence of images with a custom Vue component.
 */

class VueGalleryPlugin {
    constructor(md, options) {
        this.md = md;
        this.options = Object.assign({
          title: '',
          titleFromPrecedingHeading: true,
          vueGalleryTag: 'Gallery',
        }, options);

        md.core.ruler.after('inline', 'gallery', this.gallery.bind(this));
    }

    gallery(state) {
        const tokens = state.tokens;
        const CHILD_TYPES = ['image', 'softbreak'];
        let galleryCount = 0;

        for (let i = 1; i < tokens.length - 1; i++) {
            const token = tokens[i];

            if (token.type !== 'inline') {
                continue;
            }

            if (!token.children.length) {
                continue;
            }

            // children tokens are only of type image and softbreak
            if (!token.children.reduce((acc, t) => acc && CHILD_TYPES.includes(t.type), true)) {
                continue;
            }

            // prev token is paragraph open
            if (tokens[i - 1].type !== 'paragraph_open') {
                continue;
            }

            // next token is paragraph close
            if (!tokens[i + 1] || tokens[i + 1].type !== 'paragraph_close') {
                continue;
            }

            const children = token.children.filter(t => t.type === 'image');

            // preceding element must be a heading in order to reuse the heading text within the gallery
            if (this.options.titleFromPrecedingHeading) {
                if (tokens[i - 2].type !== 'heading_close') {
                    continue;
                }
            }

            // id
            const id = galleryCount;

            galleryCount += 1;

            // images
            const images = [];

            children.forEach((child, key) => {
                images.push({
                    alt: child.content,
                    id: key,
                    src: child.attrGet('src')
                });
            });

            // title
            let title = this.title;

            if (this.options.titleFromPrecedingHeading) {
                title = tokens[i - 3].content;

                if (tokens[i - 4].type === 'heading_open') {
                    // note: generated id (anchor) attribute is not present when this plugin runs
                    // it is generated in the Vue component
                    tokens[i - 4].attrSet('hidden', 'hidden');
                }
            }

            // https://stackoverflow.com/a/64049986
            let imagesStr = JSON.stringify(images);
            imagesStr = imagesStr.replace(/"([^"]+)":/g, '$1:'); // unquote property keys
            imagesStr = imagesStr.replaceAll("'", "\'"); // escape single quotes in content
            imagesStr = imagesStr.replaceAll("\"", "'"); // use single quotes around property values

            // repurpose paragraph_open token
            tokens[i - 1].content = `<${this.options.vueGalleryTag} id="${id}" title="${title}" :images="${imagesStr}"/>`;
            tokens[i - 1].type = 'html_block';

            // repurpose paragraph_close token
            tokens[i + 1].content = '';
            tokens[i + 1].type = 'html_block';
        }
    }
}

module.exports = (md, options = {}) => new VueGalleryPlugin(md, options);
