import * as db from "../db";
import * as dyndns from "../modules/dyndns";
import Logs from "../logs";
const logs = Logs(module);

/**
 * Sets the static IP
 *
 * @param {(string|null)} staticIp New static IP
 * - To enable: "85.84.83.82"
 * - To disable: null
 */
export async function setStaticIp({
  staticIp
}: {
  staticIp: string;
}): Promise<void> {
  const oldStaticIp = db.staticIp.get();
  db.staticIp.set(staticIp);

  // Parse action to display a feedback message
  if (!oldStaticIp && staticIp) {
    logs.info(`Enabled static IP: ${staticIp}`);
  } else if (oldStaticIp && !staticIp) {
    await dyndns.updateIp();
    const domain = db.domain.get();
    logs.info(`Disabled static IP, and registered to dyndns: ${domain}`);
  } else {
    logs.info(`Updated static IP: ${staticIp}`);
  }
}

module.exports = setStaticIp;
