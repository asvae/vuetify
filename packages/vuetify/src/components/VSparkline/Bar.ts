import mixins from '../../util/mixins'
import { VNode } from 'vue'

import props from './mixins/props'
import Rect from './components/rect'
import Text from './components/text'
import Gradient from './components/gradient'
import { genPoints } from './helpers/core'

export default mixins(props).extend({
  name: 'bar',

  props: {
    autoDrawDuration: {
      type: Number,
      default: 500
    }
  },

  render (h): VNode {
    if (!this.data || this.data.length < 2) return undefined as never
    const { width, height, padding, lineWidth } = this
    const viewWidth = width || 300
    const viewHeight = height || 75
    const boundary = {
      minX: padding,
      minY: padding,
      maxX: viewWidth - padding,
      maxY: viewHeight - padding
    }
    const props = this.$props

    props.points = genPoints(this.data, boundary)

    const totalWidth = boundary.maxX / (props.points.length - 1)

    props.boundary = boundary
    props.id = 'sparkline-bar-' + this._uid
    props.lineWidth = lineWidth || (totalWidth - (padding || 5))
    props.offsetX = (totalWidth - props.lineWidth) / 2

    return h('svg', {
      attrs: {
        width: width || '100%',
        height: height || '25%',
        viewBox: `0 0 ${viewWidth} ${viewHeight}`
      }
    }, [
      h(Gradient, { props }),
      h(Rect, { props }),
      this.showLabel ? h(Text, { props }) : undefined as never,
      h('g', {
        attrs: {
          transform: `scale(1,-1) translate(0,-${boundary.maxY})`,
          'clip-path': `url(#${props.id}-clip)`,
          fill: `url(#${props.id})`
        }
      }, [
        h('rect', {
          attrs: {
            x: 0,
            y: 0,
            width: viewWidth,
            height: viewHeight
          }
        })
      ])
    ])
  }
})
