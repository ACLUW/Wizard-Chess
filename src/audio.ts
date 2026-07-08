export type AttackSoundKind = "move" | "sparks" | "arcane" | "shockwave" | "inferno" | "royal";

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

  if (kind === "arcane") {
    playTone(context, 420, now, 0.12, "triangle", 0.045);
    playTone(context, 880, now + 0.035, 0.16, "sine", 0.035);
    return;
  }

  if (kind === "shockwave") {
    playTone(context, 135, now, 0.18, "sawtooth", 0.075);
    playTone(context, 72, now + 0.055, 0.28, "triangle", 0.055);
    return;
  }

  if (kind === "inferno") {
    playTone(context, 95, now, 0.25, "sawtooth", 0.08);
    playTone(context, 240, now + 0.04, 0.18, "triangle", 0.055);
    playTone(context, 520, now + 0.09, 0.22, "square", 0.028);
    return;
  }

  playTone(context, 64, now, 0.36, "sawtooth", 0.09);
  playTone(context, 180, now + 0.08, 0.28, "triangle", 0.06);
  playTone(context, 760, now + 0.16, 0.32, "sine", 0.04);
}
