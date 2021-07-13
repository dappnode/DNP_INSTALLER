import React from "react";
import { SetupWizardField } from "types";
import Input from "components/Input";
import InputFieldSelect from "./InputFieldSelect";
import InputFieldFile from "./InputFieldFile";
import SelectMountpoint from "./SelectMountpoint";
import { InputSecret } from "components/InputSecret";
import { isSecret } from "utils/isSecret";

export default function InputField({
  field,
  value,
  onValueChange
}: {
  field: SetupWizardField;
  value: string;
  onValueChange: (newValue: string) => void;
}) {
  if (
    !field.target ||
    field.target.type === "environment" ||
    field.target.type === "portMapping"
  ) {
    if (field.enum)
      return (
        <InputFieldSelect
          value={value}
          options={field.enum}
          onValueChange={onValueChange}
        />
      );
    else if (isSecretField(field))
      return <InputSecret value={value} onValueChange={onValueChange} />;
    else return <Input value={value} onValueChange={onValueChange} />;
  } else if (field.target.type === "fileUpload") {
    return (
      <InputFieldFile accept={""} value={value} onValueChange={onValueChange} />
    );
  } else if (
    field.target.type === "namedVolumeMountpoint" ||
    field.target.type === "allNamedVolumesMountpoint"
  ) {
    return (
      <SelectMountpoint
        value={value}
        onValueChange={onValueChange}
      ></SelectMountpoint>
    );
  } else {
    return <div>Unknown target type</div>;
  }
}

function isSecretField(field: SetupWizardField): boolean {
  if (field.secret !== undefined) return field.secret;

  return (
    isSecret(field.id) ||
    Boolean(
      field.target &&
        field.target.type === "environment" &&
        isSecret(field.target.name)
    )
  );
}
