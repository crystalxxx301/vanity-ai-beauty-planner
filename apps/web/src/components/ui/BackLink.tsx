import { Link } from "react-router-dom";
import backIcon from "../../assets/figma/icon-back.svg";

type BackLinkProps = {
  to: string;
  label: string;
};

export function BackLink({ to, label }: BackLinkProps) {
  return (
    <Link className="back-link" to={to}>
      <img src={backIcon} width="20" height="20" alt="返回" />
      <span>{label}</span>
    </Link>
  );
}
