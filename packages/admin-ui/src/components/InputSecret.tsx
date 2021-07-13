import React, { useState } from "react";
import Input from "components/Input";
import Button from "components/Button";
import { GoEye, GoEyeClosed } from "react-icons/go";

export const InputSecret: typeof Input = props => {
  const [show, setShow] = useState(false);
  return (
    <>
      <Input
        {...props}
        type={show ? "text" : "password"}
        append={
          <>
            <Button
              onClick={() => setShow(x => !x)}
              className="input-append-button"
            >
              {show ? <GoEyeClosed /> : <GoEye />}
            </Button>
            {props.append ?? null}
          </>
        }
      />
    </>
  );
};
