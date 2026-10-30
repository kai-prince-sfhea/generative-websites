// Copyright 2026 Kai Prince. SPDX-License-Identifier: Apache-2.0
import {selectProfessionalView} from './professional.js';
if(typeof window!=='undefined'){
  globalThis.QuartoGenerative=Object.freeze({protocolVersion:1,extensionVersion:'0.0.6',selectProfessionalView});
  window.dispatchEvent(new CustomEvent('generative-websites:ready'));
}
