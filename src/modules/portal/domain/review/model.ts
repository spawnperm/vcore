export interface UxReviewPinProps {
  id: string;
  screenId: string;
  xPercent: number;
  yPercent: number;
  author: string;
  text: string;
  time: string;
  status: 'open' | 'addressed';
}

export class UxReviewPin {
  constructor(private props: UxReviewPinProps) {}

  get id(): string {
    return this.props.id;
  }

  get screenId(): string {
    return this.props.screenId;
  }

  get xPercent(): number {
    return this.props.xPercent;
  }

  get yPercent(): number {
    return this.props.yPercent;
  }

  get author(): string {
    return this.props.author;
  }

  get text(): string {
    return this.props.text;
  }

  get time(): string {
    return this.props.time;
  }

  get status(): 'open' | 'addressed' {
    return this.props.status;
  }

  public markAddressed(): void {
    this.props.status = 'addressed';
  }

  public toJSON(): UxReviewPinProps {
    return { ...this.props };
  }
}
