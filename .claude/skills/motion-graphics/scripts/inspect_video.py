#!/usr/bin/env python3
"""Read FFprobe metadata and compare delivery expectations. Never a visual/audio review."""
import argparse
import json
import math
import re
import subprocess
import sys
from fractions import Fraction
from pathlib import Path


def number(value):
    if value is None or isinstance(value, bool):
        return None
    try:
        result = float(Fraction(str(value)))
    except (ValueError, ZeroDivisionError, OverflowError):
        return None
    return result if math.isfinite(result) and result >= 0 else None


def positive(value):
    result = number(value)
    if result is None or result <= 0:
        raise argparse.ArgumentTypeError('expected a finite positive number or fraction')
    return result


def nonnegative(value):
    result = number(value)
    if result is None:
        raise argparse.ArgumentTypeError('expected a finite nonnegative number')
    return result


def size(value):
    match = re.fullmatch(r'([1-9][0-9]*)x([1-9][0-9]*)', value)
    if not match:
        raise argparse.ArgumentTypeError('expected WIDTHxHEIGHT, for example 1080x1920')
    return tuple(map(int, match.groups()))


def inspect(metadata, duration=None, dimensions=None, fps=None, audio='any', tolerance=0.1):
    streams = metadata.get('streams', [])
    videos = [s for s in streams if s.get('codec_type') == 'video'
              and not s.get('disposition', {}).get('attached_pic')]
    if not videos:
        raise ValueError('No video stream found (attached cover art does not count)')
    video = videos[0]
    actual_duration = number(video.get('duration'))
    if actual_duration is None:
        actual_duration = number(metadata.get('format', {}).get('duration'))
    actual_fps = number(video.get('avg_frame_rate'))
    if not actual_fps:
        actual_fps = number(video.get('r_frame_rate'))
    width, height = video.get('width'), video.get('height')
    has_audio = any(s.get('codec_type') == 'audio' for s in streams)
    checks = []
    def check(name, expected, observed, passed):
        checks.append(dict(name=name, expected=expected, observed=observed, passed=bool(passed)))
    if duration is not None:
        check('duration_seconds', duration, actual_duration,
              actual_duration is not None and abs(actual_duration - duration) <= tolerance)
    if dimensions is not None:
        check('dimensions', list(dimensions), [width, height], (width, height) == tuple(dimensions))
    if fps is not None:
        check('reported_fps', fps, actual_fps, actual_fps is not None and abs(actual_fps - fps) <= 0.01)
    if audio != 'any':
        check('audio_stream_present', audio == 'present', has_audio, has_audio == (audio == 'present'))
    ratio = str(Fraction(width, height)) if isinstance(width, int) and isinstance(height, int) and width > 0 and height > 0 else None
    return dict(
        technical_only=True, requested_checks_passed=all(c['passed'] for c in checks), checks=checks,
        properties=dict(width=width, height=height, aspect_ratio=ratio,
                        duration_seconds=actual_duration, reported_fps=actual_fps,
                        avg_frame_rate=video.get('avg_frame_rate'), nominal_frame_rate=video.get('r_frame_rate'),
                        reported_frames=video.get('nb_frames'), video_codec=video.get('codec_name'),
                        audio_stream_present=has_audio, video_stream_count=len(videos)),
        limitations=['No visual or audio-content inspection.', 'No full decoding or variable-frame-rate analysis.',
                     'No requested checks means metadata only, not delivery approval.'])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('video', type=Path)
    parser.add_argument('--duration', type=positive)
    parser.add_argument('--size', type=size)
    parser.add_argument('--fps', type=positive)
    parser.add_argument('--audio', choices=['present', 'absent', 'any'], default='any')
    parser.add_argument('--duration-tolerance', type=nonnegative, default=0.1)
    args = parser.parse_args()
    try:
        path = args.video.resolve(strict=True)
        if not path.is_file():
            raise ValueError('Expected a local video file')
        process = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format',
                                  '-of', 'json', str(path)], capture_output=True, text=True, timeout=45)
        if process.returncode:
            raise ValueError('FFprobe could not inspect this file: ' + process.stderr.strip()[:600])
        result = inspect(json.loads(process.stdout), args.duration, args.size, args.fps,
                         args.audio, args.duration_tolerance)
    except (OSError, ValueError, subprocess.TimeoutExpired) as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result['requested_checks_passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
