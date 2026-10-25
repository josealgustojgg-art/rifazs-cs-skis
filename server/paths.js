import path from 'node:path';
// Use native path semantics: Windows separates directories with backslashes.
export function resolveStaticPath(base,requested,paths=path){
 const target=paths.resolve(base,requested);
 const relative=paths.relative(base,target);
 if(!relative||relative==='..'||relative.startsWith('..'+paths.sep)||paths.isAbsolute(relative))return null;
 return target;
}
