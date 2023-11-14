import React, { Component } from 'react';

type FallbackImage = string | React.ReactNode | undefined | null;

interface Props {
  src?: string;
  fallbackImage: FallbackImage[];
  initialImage?: FallbackImage;
  onLoaded?: (src?: string) => void;
  /** Fired once all sources failed to load */
  onError?: (src?: string) => void;
  initialTimeout?: number;
  imgProps?: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
}

interface State {
  imageSource?: FallbackImage;
}

export default class ReactImageFallback extends Component<Props, State> {
  static displayName = 'ReactImageFallback';
  static defaultProps: Props = {
    initialImage: null,
    fallbackImage: []
  };

  private isLoaded: boolean;
  private displayImage?: HTMLImageElement | null;

  constructor(props: Props) {
    super(props);
    this.state = {
      imageSource: null
    };
    this.setDisplayImage = this.setDisplayImage.bind(this);
    this.handleInitialTimeout = this.handleInitialTimeout.bind(this);
    this.isLoaded = false;
  }

  handleInitialTimeout() {
    if (this.props.initialTimeout && this.props.initialTimeout > 0) {
      setTimeout(() => {
        if (!this.isLoaded) {
          this.setState({
            imageSource: this.props.initialImage ?? null
          });
        }
      }, this.props.initialTimeout);
    } else {
      this.setState({
        imageSource: this.props.initialImage
      });
    }
  }

  componentDidMount() {
    this.handleInitialTimeout();
    this.displayImage = new window.Image();
    this.setDisplayImage(this.props.src, this.props.fallbackImage);
  }

  componentDidUpdate(nextProps: Props) {
    if (nextProps.src !== this.props.src) {
      this.isLoaded = false;
      if (nextProps.initialImage) {
        this.handleInitialTimeout();
      }
      this.setDisplayImage(nextProps.src, nextProps.fallbackImage);
    }
  }

  componentWillUnmount() {
    if (this.displayImage) {
      this.displayImage.onerror = null;
      this.displayImage.onload = null;
      this.displayImage = null;
    }
  }

  setDisplayImage(image: FallbackImage, fallbacks: FallbackImage[]) {
    const displayImage = this.displayImage;
    if (!displayImage) return;

    const imagesArray = [image].concat(fallbacks).filter(fallback => !!fallback);
    image = imagesArray[0];

    displayImage.onerror = () => {
      const nextImage = imagesArray[1];
      if (imagesArray.length > 2 && typeof nextImage === 'string') {
        const nextFallbacks = imagesArray.slice(2);
        this.setDisplayImage(nextImage, nextFallbacks);
        return;
      }
      this.isLoaded = true;
      this.setState({ imageSource: nextImage || null }, () => void this.props.onError?.(this.props.src));
    };

    displayImage.onload = () => {
      this.isLoaded = true;
      this.setState({ imageSource: image }, () => void this.props.onLoaded?.(this.displayImage?.src));
    };

    if (typeof image === 'string') {
      displayImage.src = image;
    } else {
      this.setState({ imageSource: image }, () => void this.props.onLoaded?.(undefined));
    }
  }

  render() {
    const source = this.state.imageSource;
    if (typeof source !== 'string') return source;

    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...this.props.imgProps} src={source} />;
  }
}
