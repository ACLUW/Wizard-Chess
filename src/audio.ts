export type AttackSoundKind = "move" | "sparks" | "fire";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  audioContext ??= new AudioContext();
  return audioContext;
}

function playTone(
  context: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
  type: OscillatorType,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.55, startTime + duration);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

export function playAttackSound(kind: AttackSoundKind) {
  const context = getAudioContext();
  const now = context.currentTime;

  if (kind === "move") {
    playTone(context, 220, now, 0.08, "triangle", 0.04);
    return;
  }

  if (kind === "sparks") {
    playTone(context, 740, now, 0.08, "square", 0.035);
    playTone(context, 1120, now + 0.04, 0.09, "triangle", 0.025);
    return;
  }

  playTone(context, 95, now, 0.25, "sawtooth", 0.08);
  playTone(context, 240, now + 0.04, 0.18, "triangle", 0.055);
}
