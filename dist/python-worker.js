importScripts('./skulpt.js', './python-files.js');

const checks = {
  'print': a => isCall(a, 'print'),
  'score-add': a => a._astname === 'BinOp' && a.op.prototype?._astname === 'Add' && (isName(a.left, 'score') || isName(a.right, 'score')),
  'items-list': a => isListAssignment(a, 'items'),
  'items-index': a => a._astname === 'Subscript' && isName(a.value, 'items'),
  'for-range': a => a._astname === 'For' && isCall(a.iter, 'range'),
  'for-supplies': a => isLoop(a, 'supplies'),
  'codes-list': a => isListAssignment(a, 'codes'),
  'for-codes': a => isLoop(a, 'codes'),
  'double': a => a._astname === 'BinOp' && a.op.prototype?._astname === 'Mult',
};

function isName(node, name) {
  return node?._astname === 'Name' && node.id.v === name;
}
function isCall(node, name) {
  return node?._astname === 'Call' && isName(node.func, name);
}
function isLoop(node, list) {
  return node._astname === 'For' && isName(node.iter, list);
}
function isListAssignment(node, name) {
  return node._astname === 'Assign' && node.targets.some(target => isName(target, name)) && node.value?._astname === 'List';
}
function collect(node, nodes = []) {
  if (Array.isArray(node)) {
    for (const item of node) collect(item, nodes);
  } else if (node?._astname) {
    nodes.push(node);
    for (const item of Object.values(node)) collect(item, nodes);
  }
  return nodes;
}

self.onmessage = async ({data: {source, syntax}}) => {
  let output = '';
  try {
    Sk.configure({
      __future__: Sk.python3,
      execLimit: 1400,
      yieldLimit: 85,
      output(text) {
        output += text;
        if (output.length > 3000) throw new Error('輸出過多，程式已停止。');
      },
      read(name) {
        if (Object.hasOwn(self.pythonFiles, name)) return self.pythonFiles[name];
        throw new Error('這些練習不需要匯入模組。');
      },
      inputfun() { throw new Error('這些練習不需要 input()。'); },
    });
    const parsed = Sk.parse('mission.py', source);
    const ast = Sk.astFromParse(parsed.cst, 'mission.py', parsed.flags);
    const nodes = collect(ast);
    const missing = syntax.filter(key => !nodes.some(checks[key]));
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('mission', false, source, true));
    self.postMessage({output, missing});
  } catch (error) {
    self.postMessage({error: String(error), output});
  }
};
