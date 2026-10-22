FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SOCIAL_WATCH_BIND=0.0.0.0 \
    SOCIAL_WATCH_PORT=8000

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg nodejs tini ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /srv/skills
COPY social-watch/bridge/requirements.txt /tmp/requirements.txt
RUN python -m pip install --no-cache-dir -r /tmp/requirements.txt

COPY social-watch /srv/skills/social-watch
COPY video-watch /srv/skills/video-watch

RUN useradd --create-home --uid 1101 social && mkdir -p /tmp/social-watch && \
    chown social:social /tmp/social-watch

USER social
EXPOSE 8000
ENTRYPOINT ["tini","--"]
CMD ["python","/srv/skills/social-watch/bridge/server.py"]
