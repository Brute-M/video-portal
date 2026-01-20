declare module 'react-photo-gallery' {
    import React from 'react';

    export interface PhotoProps {
        src: string;
        width: number;
        height: number;
        alt?: string;
        key?: string;
        srcSet?: string | string[];
        sizes?: string | string[];
    }

    export interface GalleryProps {
        photos: PhotoProps[];
        direction?: 'column' | 'row';
        onClick?: (event: React.MouseEvent, photos: { photo: PhotoProps; index: number }) => void;
        margin?: number;
        targetRowHeight?: number;
        limitNodeSearch?: (container: Element) => boolean;
        renderImage?: (props: any) => React.ReactNode;
    }

    export default class Gallery extends React.Component<GalleryProps> { }
}
