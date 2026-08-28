'use strict';

import { GA_ID, METRIKA_ID } from '../../src/analytics-ids.js';

const METRIKA_SRC = 'https://mc.yandex.ru/metrika/tag.js';
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;

const LOADER = `(function(){
var h=location.hostname;
if(h==='localhost'||h==='127.0.0.1'||h==='::1'||h==='[::1]'||/\\.local$/.test(h)){return}
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();
for(var j=0;j<e.scripts.length;j++){if(e.scripts[j].src===r){return}}
k=e.createElement(t);k.async=1;k.src=r;a=e.getElementsByTagName(t)[0];a.parentNode.insertBefore(k,a);
})(window,document,'script','${METRIKA_SRC}','ym');
ym(${METRIKA_ID},'init',{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
window.dataLayer=window.dataLayer||[];
window.gtag=function(){window.dataLayer.push(arguments)};
gtag('js',new Date());
gtag('config','${GA_ID}');
var g=document.createElement('script');g.async=1;g.src='${GTAG_SRC}';
document.head.appendChild(g);
})();`;

const NOSCRIPT = `<noscript><div><img src="https://mc.yandex.ru/watch/${METRIKA_ID}" style="position:absolute; left:-9999px;" alt=""/></div></noscript>`;

export function analyticsPreconnect(indent = '') {
    return [
        `${indent}<link rel="preconnect" href="https://mc.yandex.ru">`,
        `${indent}<link rel="preconnect" href="https://www.googletagmanager.com">`,
    ].join('\n');
}

export function analyticsScripts(indent = '') {
    return [
        `${indent}<script>${LOADER}</script>`,
        `${indent}${NOSCRIPT}`,
    ].join('\n');
}
