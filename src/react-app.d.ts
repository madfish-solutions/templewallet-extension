/// <reference types="node" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare type ImportedSVGComponent = React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly PUBLIC_URL: string;
  }
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  export const ReactComponent: ImportedSVGComponent;

  const defExport: never;
  export default defExport;
}

declare module '*.svg?url' {
  const srcUrl: string;
  export default srcUrl;
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
