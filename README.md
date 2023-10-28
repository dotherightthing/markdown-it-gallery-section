# markdown-it-gallery-section

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin for sectioning content and creating image galleries, primarily for use with a custom Vuepress theme.

Features:

1. subdivides content into sections (tag or custom Vue component)
   * I find this preferable to manually adding [Markdown slots](https://vuepress.vuejs.org/guide/markdown-slot.html), plus the tag can be used to inject a Vue component.
2. wraps adjacent heading and images in a gallery (tag or custom Vue component)
   * I find this preferable to using a Vue component directly in the Vuepress markdown file. Images are core content and should be visible when editing content in a pluggable IDE without requiring Vuepress for compilation.
3. wraps remaining content in a content wrapper
   * to facilitate grid layouts

Initially this was two separate plugins (markdown-it-gallery and markdown-it-section), but as these fought one another in the markup order I took the path of least resistance and combined them.

Code based on <https://github.com/amokrushin/markdown-it-gallery-section>.

## Usage

<a name="GalleryPlugin"></a>

## GalleryPlugin
**Kind**: global class  
**Summary**: Injects Vue gallery scaffolding into markdown and transforms file-relative image paths to server-root-relative image paths  
**Access**: public  
<a name="new_GalleryPlugin_new"></a>

### new GalleryPlugin(options)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | Instance options |
| [options.contentWrapperClass] | <code>string</code> | <code>&quot;entry-content&quot;</code> | CSS class hook for styling the content following the gallery |
| [options.contentWrapperTag] | <code>string</code> | <code>&quot;div&quot;</code> | Tag name (or name of the Vue component, authored separately) |
| [options.galleryClass=] | <code>string</code> |  | CSS class hook for styling the gallery |
| [options.galleryTag] | <code>string</code> | <code>&quot;Gallery&quot;</code> | Tag name (or name of the Vue component, authored separately) |
| [options.headingLevel] | <code>string</code> | <code>&quot;h2&quot;</code> | Heading Level which appears before a sequence of images) |
| [options.imagePathOld] | <code>string</code> | <code>&quot;/.vuepress/public/images&quot;</code> | Root relative directory path to images folder (within site folder) |
| [options.imagePathNew] | <code>string</code> | <code>&quot;/images&quot;</code> | Root relative server path to images folder |
| [options.sectionClass=] | <code>string</code> |  | CSS class hook for styling the section |
| [options.sectionTag] | <code>string</code> | <code>&quot;ContentSection&quot;</code> | Tag name (or name of the Vue component, authored separately) |


### Example (Vuepress)

```js
// .vuepress/config.js

module.exports = {
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-gallery-section'), {
        contentWrapperClass: 'entry-content',
        contentWrapperTag: 'div',
        galleryClass: '',
        galleryTag: 'Gallery',
        headingLevel: 'h2',
        sectionClass: '', 
        sectionTag: 'ContentSection'
      })
    }
  }
}
```

```vue
// .vuepress/components/ContentSection.vue (simplified example)
// Note: headingContent could be used to programmatically link the section to the contained headingLevel

<template>
  <div class="content-section" :data-heading-content="headingContent">
    <slot/>
  </div>
</template>

<script>
export default {
  name: 'ContentSection',
  props: {
    headingContent: String
  }
}
</script>
```

```vue
// .vuepress/components/Gallery.vue (simplified example)

<template>
  <div class="gallery" :id="'gallery-' + id">
    <div class="gallery-header">
      <slot/>
    </div>
    <div class="gallery-items">
      <GalleryThumbnail v-for="(item,key) in images"
        :src="item.src"
        :alt="item.alt"
        :galleryId="id"
        :id="item.id"
        :key="key"
      />
    </div>
  </div>
</template>

<script>
import GalleryThumbnail from "./GalleryThumbnail";

export default {
  name: 'Gallery',
  computed: {
    titleId() {
      return this.stringToId(this.title);
    }
  },
  methods: {
    stringToId: function(str) {
      return str
        .trim()
        .toLowerCase()
        .replaceAll(/([ /.,'"!()])+/g, '-')
        .replaceAll(/[-]{2,}/g, '-');
    }
  },
  props: {
    id: String,
    images: Array,
    title: String
  },
}
</script>
```

```vue
// .vuepress/components/GalleryThumbnail.vue (simplified example)

<template>
    <img :src="src" class="gallery-image" :alt="alt" :id="'gallery-' + galleryId + '-image-' + id" width="300" height="300">
</template>

<script>
export default {
  name: 'GalleryThumbnail',
  props: {
    alt: String,
    galleryId: String,
    id: Number,
    src: String
  }
}
</script>
```

#### Input markdown

```md
## Heading 2.1

![Gallery Image 1](http://example.com/image-1.jpg)
![Gallery Image 2](http://example.com/image-2.jpg)

Lorem ipsum dolor sit amet.
```

#### Output HTML

Note that the heading anchor is automatically added by VuePress.

```html
<div class="content-section" data-heading-content="Heading 2.1">
  <div class="gallery" id="gallery-0">
      <div class="gallery-header">
        <h2 id="heading-2-1">Heading 2.1</h2>
      </div>
      <div class="gallery-items">
          <img src="http://example.com/image-1.jpg" class="gallery-image" alt="Gallery Image 1" id="gallery-0-image-0" width="300" height="300">
          <img src="http://example.com/image-2.jpg" class="gallery-image" alt="Gallery Image 2" id="gallery-0-image-1" width="300" height="300">
      </div>
  </div>
  <div class="entry-content">
    <p>Lorem ipsum dolor sit amet.</p>
  </div>
</div>
```
