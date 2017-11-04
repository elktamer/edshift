class ShiftEditor{
  constructor(props){
    super(props)
    this.createShiftEditor = this.createShiftEditor.bind(this)
  }

  componentDidMount() {
    this.createShiftEditor()
  }

  componentDidUpdate() {
    this.createShiftEditor()
  }

  createShiftEditor() {
    render() {
      return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
      </svg>
    }
}

export default ShiftEditor
