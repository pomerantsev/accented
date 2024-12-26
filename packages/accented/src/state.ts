type State = {
  enabled: boolean,
  abortController: AbortController,
  elements: Array<Element>
};

const state: State = {
  enabled: false,
  abortController: new AbortController(),
  elements: []
};

export default state;
