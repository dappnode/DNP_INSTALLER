import { listContainers } from "../modules/docker/listContainers";
import { readManifestIfExists } from "../modules/manifest";
import * as db from "../db";
import { InstalledPackageDetailData } from "../types";
import { logs } from "../logs";
import { ComposeFileEditor } from "../modules/compose/editor";

/**
 * Toggles the visibility of a getting started block
 * @param show Should be shown on hidden
 */
export async function packageGet({
  id
}: {
  id: string;
}): Promise<InstalledPackageDetailData> {
  if (!id) throw Error("kwarg id must be defined");

  const dnpList = await listContainers();
  const dnp = dnpList.find(_dnp => _dnp.name === id);
  if (!dnp) throw Error(`No DNP was found for name ${id}`);
  const dnpData: InstalledPackageDetailData = dnp;

  try {
    const manifest = readManifestIfExists(dnpData);
    if (manifest && manifest.setupWizard) {
      // Setup wizard, only include the environment fields
      dnpData.setupWizard = {
        ...manifest.setupWizard,
        fields: manifest.setupWizard.fields.filter(
          field => field.target && field.target.type === "environment"
        )
      };

      // Getting started
      dnpData.gettingStarted = manifest.gettingStarted;
      dnpData.gettingStartedShow = Boolean(
        db.packageGettingStartedShow.get(dnpData.name)
      );
    }
  } catch (e) {
    logs.warn(`Error getting manifest for ${dnpData.name}`, e);
  }

  // User settings
  try {
    // Why not fetch the ENVs from a container inspect > config ??
    // ENVs that are not declared in the compose will show up (i.e. PATH)
    // So it's easier and cleaner to just parse the docker-compose.yml
    const compose = new ComposeFileEditor(dnpData.name, dnpData.isCore);
    dnpData.userSettings = {
      environment: compose.service().getEnvs()
    };
  } catch (e) {
    logs.warn(`Error getting user settings for ${dnpData.name}`, e);
  }

  return dnp;
}
