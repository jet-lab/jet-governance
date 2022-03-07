export function Loader(props: { button?: boolean; fullview?: boolean }) {
  return (
    <div
      className={`loader flex-centered column
      ${props.button ? "button" : ""}
      ${props.fullview ? "fullview" : ""}`}
    >
      <div className="outer-circle">
        <div className="inner-circle">
          <img src="img/jet/jet_logomark_gradient.png" alt="Jet Logomark" />
        </div>
      </div>
    </div>
  );
}
