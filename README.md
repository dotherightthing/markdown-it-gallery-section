# markdown-it-vuepress-gallery

A [markdown-it](https://github.com/markdown-it/markdown-it) plugin for wrapping a sequence of images with a custom Vue component. For use with Vuepress.

I find this preferable to using a Vue component directly in the Vuepress markdown file. Images are core content and should be visible when editing content in a pluggable IDE without requiring Vuepress for compilation.

Based on <https://github.com/amokrushin/markdown-it-gallery>.

## Usage

### Options

| Option                    | Type    | Default   | Description                                                                                 |
|---------------------------|---------|-----------|---------------------------------------------------------------------------------------------|
| title                     | String  | ""        | Title to pass to the Vue Component                                                          |
| titleFromPrecedingHeading | Boolean | true      | Reuse the title from the preceding sibling heading element (rather than providing a string) |
| vueGalleryTag             | String  | "Gallery" | Name of the Vue component (authored separately)                                             |

### Example

```js
// .vuepress/config.js

module.exports = {
  markdown: {
    extendMarkdown: md => {
      md.use(require('markdown-it-vuepress-gallery'))
    }
  }
}
```

```vue
// .vuepress/components/Gallery.vue (simplified example)

<template>
    <div class="gallery" :id="'gallery-' + id">
        <h2 :id="titleId">{{ title }}</h2>
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
  props: {
    alt: String,
    galleryId: String,
    id: String,
    src: String
  }
}
</script>
```

#### Input markdown

```md
## Heading 1

![Gallery Image 1](http://example.com/image-1.jpg)
![Gallery Image 2](http://example.com/image-2.jpg)
```

#### Output HTML

Note that the heading anchor is automatically added by VuePress.

```html
<h2 id="heading-1" hidden="hidden"><a href="#heading-1" class="header-anchor">#</a> Heading 1</h2>
<div class="gallery" id="gallery-0">
    <h2 id="heading-1">Heading 1</h2>
    <div class="gallery-items">
        <img src="http://example.com/image-1.jpg" class="gallery-image" alt="Gallery Image 1" id="gallery-0-image-0" width="300" height="300">
        <img src="http://example.com/image-2.jpg" class="gallery-image" alt="Gallery Image 2" id="gallery-0-image-1" width="300" height="300">
    </div>
</div>
```
