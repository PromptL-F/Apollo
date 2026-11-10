import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useEffect } from "react";
import { useApolloAmbient } from "@/hooks/use-apollo-ambient";

export function ApolloAmbient() {
  const { enabled } = useApolloAmbient();
  const player = useAudioPlayer(require("../assets/audio/apollo-terminal-hum.wav"), { downloadFirst: true });
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false });
  }, []);
  useEffect(() => {
    // expo-audio exposes playback controls as mutable native properties.
    // eslint-disable-next-line react-hooks/immutability
    player.loop = true;
    player.volume = 0.11;
    if (enabled) player.play();
    else player.pause();
  }, [enabled, player]);
  return null;
}
