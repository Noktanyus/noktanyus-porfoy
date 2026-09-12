/**
 * @react-pdf/renderer type declarations.
 *
 * Bu paket optional dependency olarak kabul edilir; runtime'da yüklü değilse
 * graceful HTML fallback devreye girer (pdfExport.tsx). TypeScript
 * type-check için minimal bir module declaration yeterli.
 */

declare module '@react-pdf/renderer' {
  import type { ComponentType, ReactNode, ReactElement } from 'react';

  export interface StyleSheet {
    [key: string]: unknown;
  }

  export const StyleSheet: {
    create<T extends Record<string, unknown>>(styles: T): T;
  };

  export interface DocumentProps {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    children?: ReactNode;
  }

  export interface PageProps {
    size?: 'A4' | 'A3' | 'LETTER' | 'LEGAL' | string;
    style?: unknown;
    children?: ReactNode;
  }

  export interface TextProps {
    style?: unknown;
    children?: ReactNode;
    fixed?: boolean;
  }

  export interface ViewProps {
    style?: unknown;
    children?: ReactNode;
  }

  export interface ImageProps {
    src?: string;
    style?: unknown;
    alt?: string;
  }

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const Text: ComponentType<TextProps>;
  export const View: ComponentType<ViewProps>;
  export const Image: ComponentType<ImageProps>;

  export function renderToBuffer(element: ReactElement): Promise<Buffer>;
  export function renderToStream(element: ReactElement): Promise<NodeJS.ReadableStream>;
  export function renderToString(element: ReactElement): Promise<string>;
  export function PDFDownloadLink(props: {
    document: ReactElement;
    fileName: string;
    children: ReactNode;
  }): ComponentType;
  export function PDFViewer(props: {
    children?: ReactNode;
    children?: ReactNode;
  }): ComponentType;
  export function BlobProvider(props: {
    document: ReactElement;
    children: (state: { url: string | null; loading: boolean }) => ReactNode;
  }): ComponentType;
}