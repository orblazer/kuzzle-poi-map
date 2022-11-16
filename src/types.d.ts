import { KDocumentContentGeneric } from "kuzzle-sdk";
import { LatLngTuple } from "leaflet";

declare interface KMarker {
  _id: string;
  name: string;
  position: LatLngTuple;
  state: "new" | "visited";
}
declare type KMarkerDocument = KDocumentContentGeneric & Marker;

declare interface KNotification {
  id: number;
  type: "error" | "success";
  message: string;
  timeout: number;
}
