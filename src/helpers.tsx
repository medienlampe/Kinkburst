import Flavour from "./interfaces";

export const findAllDescendants = (flavours, flavourUuid) : Flavour[] => {
  const children = flavours
    .filter(flavour => flavour.parentUuid === flavourUuid)
    .map(flavour => flavour.uuid);

  const descendants = children.flatMap(uuid => findAllDescendants(flavours, uuid));

  return children.concat(descendants);
}