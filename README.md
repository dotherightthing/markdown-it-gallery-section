# markdown-it-gallery

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin, predominately for use with Vuepress.

Features:

1. subdivides content into sections (tag or custom Vue component)
   * I find this preferable to manually adding [Markdown slots](https://vuepress.vuejs.org/guide/markdown-slot.html), plus the tag can be used to inject a Vue component.
2. wraps adjacent heading and images in a gallery (tag or custom Vue component)
   * I find this preferable to using a Vue component directly in the Vuepress markdown file. Images are core content and should be visible when editing content in a pluggable IDE without requiring Vuepress for compilation.

Initially this was two separate plugins, but as these fought one another in the markup order I took the path of least resistance and combined them.

Code based on <https://github.com/amokrushin/markdown-it-gallery>.

## Usage

### Options

| Option              | Type    | Default          | Description                                                  |
|---------------------|---------|------------------|--------------------------------------------------------------|
| contentWrapperClass | String  | "entry-content"  | CSS class hook for styling the content following the gallery |
| contentWrapperTag   | String  | "div"            | Tag name (or name of the Vue component, authored separately) |
| galleryClass        | String  | ""               | CSS class hook for styling the gallery                       |
| galleryTag          | String  | "Gallery"        | Tag name (or name of the Vue component, authored separately) |
| headingLevel        | String  | "h2"             | Heading Level which appears before a sequence of images      |
| sectionClass        | String  | ""               | CSS class hook for styling the section                       |
| sectionTag          | String  | "ContentSection" | Tag name (or name of the Vue component, authored separately) |

### Example (Vuepress)

```js
// .vuepress/config.js

module.exports = {
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-gallery'), {
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
      <GalleryItem v-for="(item,key) in images"
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
import GalleryItem from "./GalleryItem";

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
// .vuepress/components/GalleryItem.vue (simplified example)

<template>
    <img :src="src" class="gallery-image" :alt="alt" :id="'gallery-' + galleryId + '-image-' + id" width="300" height="300">
</template>

<script>
export default {
  name: 'GalleryItem',
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
