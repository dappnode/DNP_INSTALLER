import React, { useState, useEffect } from "react";
import { api } from "api";
// Components
import Card from "components/Card";
import SubTitle from "components/SubTitle";
import RenderMarkdown from "components/RenderMarkdown";
import { MdClose } from "react-icons/md";
// This
import { Links } from "./Links";
import newTabProps from "utils/newTabProps";
import { InstalledPackageDetailData, Manifest } from "types";
import { ipfsGatewayUrl } from "pages/system/data";
import { RemovePackage } from "./RemovePackage";
import { VolumesList } from "./VolumesList";
import { ContainerList } from "./ContainerList";
import { RenderPackageSentData } from "./PackageSentData";
import "./info.scss";

export function Info({
  dnp,
  manifest,
  gettingStarted,
  gettingStartedShow
}: {
  dnp: InstalledPackageDetailData;
  manifest?: Manifest;
  gettingStarted?: string;
  gettingStartedShow?: boolean;
}) {
  const [gettingStartedShowLocal, setGettingStartedIsShown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Show the version from `docker ps`, which the one affecting logic
  const { dnpName, version, origin } = dnp;
  // Show the upstream version from the manifest which is used for metadata only
  const { upstreamVersion, links } = manifest || {};

  useEffect(() => {
    setGettingStartedIsShown(Boolean(gettingStartedShow));
  }, [gettingStartedShow]);

  async function hideGettingStarted() {
    if (!loading)
      try {
        setLoading(true);
        setGettingStartedIsShown(false);
        if (gettingStartedShow)
          await api.packageGettingStartedToggle({ dnpName, show: false });
      } catch (e) {
        console.error(`Error on packageGettingStartedToggle: ${e.stack}`);
      } finally {
        setLoading(false);
      }
  }

  if (!dnp) return null;

  return (
    <>
      {gettingStarted && gettingStartedShowLocal && (
        <>
          <SubTitle
            className={`getting-started-header ${loading ? "loading" : ""}`}
          >
            <div>Getting started</div>
            <div>
              <MdClose onClick={hideGettingStarted} />
            </div>
          </SubTitle>
          <Card className="getting-started-content">
            <RenderMarkdown source={gettingStarted} />
            <div className="subtle-header" onClick={hideGettingStarted}>
              Dismiss
            </div>
          </Card>
        </>
      )}

      <Card spacing divider>
        <div className="package-info">
          {/* <ReadMoreMarkdown
            source={
              dnp.manifest?.description || dnp.manifest?.shortDescription || ""
            }
          /> */}

          <div className="version-info">
            <strong>Version: </strong>
            {version} {upstreamVersion && `(${upstreamVersion} upstream)`}{" "}
            {origin ? (
              <a href={`${ipfsGatewayUrl}${origin}`} {...newTabProps}>
                {origin}
              </a>
            ) : null}
          </div>

          {gettingStarted && !gettingStartedShowLocal && (
            <div>
              <strong>Getting started: </strong>
              <span
                className="a-style"
                onClick={() => setGettingStartedIsShown(true)}
              >
                show
              </span>
            </div>
          )}

          <div>
            {/* Support legacy manifests,  homepage = {userui: "http://some.link"} */}
            <Links links={links || ((manifest as any) || {}).homepage || {}} />
          </div>
        </div>

        <RenderPackageSentData
          dnpName={dnp.dnpName}
          data={dnp.packageSentData}
        />

        <ContainerList dnp={dnp} />

        <VolumesList dnp={dnp} />

        <RemovePackage dnp={dnp} />
      </Card>
    </>
  );
}
