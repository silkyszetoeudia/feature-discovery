import type {ReactElement} from 'react';

type PlayButtonProps = {
  onClick: () => void;
};

export default function PlayButton({onClick}: PlayButtonProps): ReactElement {
  return (
    <button className="disc-play" type="button" aria-label="Play" onClick={onClick}>
      <img src="/assistant/v1/play.svg" alt="" width={20} height={20} />
    </button>
  );
}
