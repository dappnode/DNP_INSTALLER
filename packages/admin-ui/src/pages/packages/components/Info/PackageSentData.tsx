import React, { useState, useEffect } from "react";
import ClipboardJS from "clipboard";
import InputGroup from "react-bootstrap/esm/InputGroup";
import Button from "components/Button";
import { GoEye, GoEyeClosed, GoClippy } from "react-icons/go";
import { isSecret } from "utils/isSecret";
import { api } from "api";
import { withToastNoThrow } from "components/toast/Toast";
import { confirm } from "components/ConfirmDialog";
import "./packageSentData.scss";

export function RenderPackageSentData({
  dnpName,
  data
}: {
  dnpName: string;
  data: Record<string, string>;
}) {
  const entries = Object.entries(data);

  if (entries.length === 0) return null;

  async function onDelete() {
    await new Promise<void>(resolve =>
      confirm({
        title: "Removing sent data",
        text: "Are you sure you want to delete?",
        label: "Remove",
        onClick: resolve
      })
    );

    withToastNoThrow(() => api.packageSentDataDelete({ dnpName }), {
      message: "Deleting sent data",
      onSuccess: "Deleted sent data"
    });
  }

  return (
    <div className="package-sent-data">
      <header className="list-grid-header">Key</header>
      <header className="list-grid-header">Package sent values</header>

      {entries.map(([key, value]) => (
        <React.Fragment key={key}>
          <div>{key}</div>
          <div>
            <SentDataRow key={key} value={value} isSecret={isSecret(key)} />
          </div>
        </React.Fragment>
      ))}

      <span className="grid-footer">
        <span onClick={onDelete} className="delete-all">
          Delete all
        </span>
      </span>
    </div>
  );
}

function SentDataRow({
  value,
  isSecret
}: {
  value: string;
  isSecret?: boolean;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Activate the copy functionality
    new ClipboardJS(".copy-input-copy");
  }, []);

  return (
    <InputGroup>
      <input
        className="form-control copiable-input"
        type={!isSecret || show ? "text" : "password"}
        value={value}
        readOnly={true}
      />

      <InputGroup.Append>
        {isSecret && (
          <Button
            onClick={() => setShow(x => !x)}
            className="input-append-button"
          >
            {show ? <GoEyeClosed /> : <GoEye />}
          </Button>
        )}

        <Button
          className="input-append-button copy-input-copy"
          data-clipboard-text={value}
        >
          <GoClippy />
        </Button>
      </InputGroup.Append>
    </InputGroup>
  );
}
