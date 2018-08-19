import '../../stylus/components/_images.styl'

// Types
import { VNode } from 'vue'
import { PropValidator } from 'vue/types/options'

// Components
import VResponsive from '../VResponsive'

// Utils
import { consoleError } from '../../util/console'

// not intended for public use, this is passed in by vuetify-loader
export interface srcObject {
  src: string
  srcset?: string
  lazySrc: string
  aspect: number
}

/* @vue/component */
export default VResponsive.extend({
  name: 'v-img',

  props: {
    alt: String,
    contain: Boolean,
    src: {
      type: [String, Object],
      default: ''
    } as PropValidator<string | srcObject>,
    lazySrc: String,
    srcset: String,
    sizes: String,
    position: {
      type: String,
      default: 'center center'
    },
    transition: {
      type: String,
      default: 'fade-transition'
    }
  },

  data () {
    return {
      currentSrc: '', // Set from srcset
      image: null as HTMLImageElement | null,
      isLoading: true,
      calculatedAspectRatio: undefined as number | undefined
    }
  },

  computed: {
    computedAspectRatio (): number {
      return this.normalisedSrc.aspect
    },
    normalisedSrc (): srcObject {
      return typeof this.src === 'string'
        ? {
          src: this.src,
          srcset: this.srcset,
          lazySrc: this.lazySrc,
          aspect: Number(this.aspectRatio || this.calculatedAspectRatio)
        }
        : {
          src: this.src.src,
          srcset: this.srcset || this.src.srcset,
          lazySrc: this.lazySrc || this.src.lazySrc,
          aspect: Number(this.aspectRatio || this.src.aspect || this.calculatedAspectRatio)
        }
    },
    __cachedImage (): VNode | never[] {
      if (!(this.normalisedSrc.src || this.normalisedSrc.lazySrc)) return []

      const src = this.isLoading ? this.normalisedSrc.lazySrc : this.currentSrc

      return this.$createElement('transition', {
        attrs: {
          name: this.transition,
          mode: 'in-out'
        }
      }, [
        this.$createElement('div', {
          staticClass: 'v-image__image',
          class: {
            'v-image__image--preload': this.isLoading,
            'v-image__image--contain': this.contain,
            'v-image__image--cover': !this.contain
          },
          style: {
            backgroundImage: src ? `url("${src}")` : undefined,
            backgroundPosition: this.position
          },
          key: +this.isLoading
        })
      ])
    }
  },

  watch: {
    src () {
      if (!this.isLoading) this.init()
      else this.loadImage()
    },
    '$vuetify.breakpoint.width': 'getSrc'
  },

  beforeMount () {
    this.init()
  },

  methods: {
    init () {
      if (this.normalisedSrc.lazySrc) {
        const lazyImg = new Image()
        lazyImg.src = this.normalisedSrc.lazySrc
        this.pollForSize(lazyImg, null)
      }
      /* istanbul ignore else */
      if (this.normalisedSrc.src) this.loadImage()
    },
    onLoad () {
      this.getSrc()
      this.isLoading = false
      this.$emit('load', this.src)
    },
    onError () {
      consoleError('Image load failed\n\nsrc: ' + this.normalisedSrc.src, this)
      this.$emit('error', this.src)
    },
    getSrc () {
      /* istanbul ignore else */
      if (this.image) this.currentSrc = this.image.currentSrc
    },
    loadImage () {
      const image = new Image()
      this.image = image

      image.onload = () => {
        /* istanbul ignore if */
        if (image.decode) {
          /* tslint:disable-next-line no-floating-promises */
          image.decode().then(this.onLoad)
        } else {
          this.onLoad()
        }
      }
      image.onerror = this.onError

      image.src = this.normalisedSrc.src
      this.sizes && (image.sizes = this.sizes)
      this.normalisedSrc.srcset && (image.srcset = this.normalisedSrc.srcset)

      this.aspectRatio || this.pollForSize(image)
      this.currentSrc = image.currentSrc
    },
    pollForSize (img: HTMLImageElement, timeout: number | null = 100) {
      const poll = () => {
        const { naturalHeight, naturalWidth } = img

        if (naturalHeight || naturalWidth) {
          this.calculatedAspectRatio = naturalWidth / naturalHeight
        } else {
          timeout != null && setTimeout(poll, timeout)
        }
      }

      poll()
    },
    __genPlaceholder (): VNode | void {
      if (this.$slots.placeholder) {
        const placeholder = this.$createElement('div', {
          staticClass: 'v-image__placeholder'
        }, this.$slots.placeholder)

        return this.$createElement('transition', {
          attrs: { name: this.transition }
        }, this.isLoading ? [placeholder] : [])
      }
    }
  },

  render (h): VNode {
    const node = VResponsive.options.render.call(this, h)

    node.data.staticClass += ' v-image'

    node.data.attrs = {
      role: this.alt ? 'img' : undefined,
      'aria-label': this.alt
    }

    node.children = [
      this.__cachedSizer,
      this.__cachedImage,
      this.__genPlaceholder(),
      this.genContent()
    ]

    return h(node.tag, node.data, node.children)
  }
})
