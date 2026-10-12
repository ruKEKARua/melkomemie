import type { ReactNode } from "react";

interface Button {

    onClick?: () => void;
    label?: string;
    className: string;
    children?: ReactNode;
    disabled?: boolean;


}


const Button = ({ onClick, label='', className, children='', disabled = false }: Button) => {
  return (
    <button onClick={onClick} disabled={disabled} className={className + ` cursor-pointer`} >
        {label || children}
    </button>
  )
}

export default Button