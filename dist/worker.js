'use strict';
importScripts('engine.js');
self.onmessage = ({data}) => {
  try { self.postMessage({ id:data.id, review:TraceEngine.analyze(data.text, {language:data.language}) }); }
  catch (error) { self.postMessage({ id:data.id, error:error.message }); }
};
