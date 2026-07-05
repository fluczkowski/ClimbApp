import { useEffect } from "react";
import type { RefObject } from "react";
import type { AnalysisResult } from "../types";

export const useVideoOverlay = (
    videoRef: RefObject<HTMLVideoElement | null>,
    canvasRef: RefObject<HTMLCanvasElement | null>,
    result: AnalysisResult | null,
    showOverlay: boolean,
    showSkeleton: boolean,
) => {
    useEffect(() => {
        if (!result || !videoRef.current || !canvasRef.current) return;
    
        const frames = result.summary.frame_data;
    
        let animationFrameId: number;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
    
        const drawOverlay = () => {
          if (!ctx || !video || !canvas) return;
          
          if (video.clientWidth === 0 || video.clientHeight === 0) {
            animationFrameId = requestAnimationFrame(drawOverlay);
            return;
          }
    
          canvas.width = video.clientWidth;
          canvas.height = video.clientHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
    
          const currentTime = video.currentTime;
          
          let frame = frames[0];
          let minDiff = Math.abs(frame.time - currentTime);
          
          for (let i = 1; i < frames.length; i++) {
            const diff = Math.abs(frames[i].time - currentTime);
            if (diff < minDiff) {
              minDiff = diff;
              frame = frames[i];
            }
          }
    
          if (frame && minDiff < 0.5 && frame.com.x && frame.com.y) {
            const vWidth = video.videoWidth;
            const vHeight = video.videoHeight;
            const cWidth = canvas.width;
            const cHeight = canvas.height;
            const videoRatio = vWidth / vHeight;
            const containerRatio = cWidth / cHeight;
    
            let renderWidth, renderHeight, offsetX, offsetY;
    
            if (containerRatio > videoRatio) {
              renderHeight = cHeight;
              renderWidth = cHeight * videoRatio;
              offsetX = (cWidth - renderWidth) / 2;
              offsetY = 0;
            } else {
              renderWidth = cWidth;
              renderHeight = cWidth / videoRatio;
              offsetX = 0;
              offsetY = (cHeight - renderHeight) / 2;
            }
    
            const mapX = (val: number) => {
              const isNorm = Math.abs(val) <= 5.0;
              const normX = isNorm ? val : val / vWidth;
              return offsetX + (normX * renderWidth);
            };
            const mapY = (val: number) => {
              const isNorm = Math.abs(val) <= 5.0;
              const normY = isNorm ? val : val / vHeight;
              return offsetY + (normY * renderHeight);
            }
    
            if (showSkeleton && frame.skeleton) {
              const drawBone = (joint1: string, joint2: string) => {
                if (frame.skeleton![joint1] && frame.skeleton![joint2]) {
                  ctx.beginPath();
                  ctx.moveTo(mapX(frame.skeleton![joint1].x), mapY(frame.skeleton![joint1].y));
                  ctx.lineTo(mapX(frame.skeleton![joint2].x), mapY(frame.skeleton![joint2].y));
                  ctx.strokeStyle = "rgba(6, 182, 212, 0.8)";
                  ctx.lineWidth = 3;
                  ctx.lineCap = "round";
                  ctx.stroke();
                }
              };
    
              drawBone('left_shoulder', 'right_shoulder');
              drawBone('left_hip', 'right_hip');
              drawBone('left_shoulder', 'left_hip');
              drawBone('right_shoulder', 'right_hip');
              
              drawBone('left_shoulder', 'left_elbow');
              drawBone('left_elbow', 'left_wrist');
              drawBone('right_shoulder', 'right_elbow');
              drawBone('right_elbow', 'right_wrist');
              
              drawBone('left_hip', 'left_knee');
              drawBone('left_knee', 'left_ankle');
              drawBone('right_hip', 'right_knee');
              drawBone('right_knee', 'right_ankle');
            }
            if (showOverlay) {
              if (frame.limbs && frame.limbs.length > 2) {
                const centerX = frame.limbs.reduce((sum, limb) => sum + mapX(limb.x), 0) / frame.limbs.length;
                const centerY = frame.limbs.reduce((sum, limb) => sum + mapY(limb.y), 0) / frame.limbs.length;
                const sortedLimbs = [...frame.limbs].sort((a, b) => {
                  const angleA = Math.atan2(mapY(a.y) - centerY, mapX(a.x) - centerX);
                  const angleB = Math.atan2(mapY(b.y) - centerY, mapX(b.x) - centerX);
                  return angleA - angleB;
                })
                ctx.beginPath();
                ctx.moveTo(mapX(sortedLimbs[0].x), mapY(sortedLimbs[0].y));
                for (let i = 1; i < sortedLimbs.length; i++) {
                  ctx.lineTo(mapX(sortedLimbs[i].x), mapY(sortedLimbs[i].y));
                }
                ctx.closePath();
                ctx.fillStyle = frame.off_balance ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)';
                ctx.fill();
                ctx.lineWidth = 2;
                ctx.strokeStyle = frame.off_balance ? 'rgba(239, 68, 68, 0.8)' : 'rgba(34, 197, 94, 0.8)';
                ctx.stroke();
              }
    
              if (frame.limbs) {
                frame.limbs.forEach(limb => {
                  ctx.beginPath();
                  ctx.arc(mapX(limb.x), mapY(limb.y), 5, 0, 2 * Math.PI);
                  ctx.fillStyle = '#f59e0b';
                  ctx.fill();
                  ctx.lineWidth = 1.5;
                  ctx.strokeStyle = "#fff"
                  ctx.stroke();
                });
              }
    
              const comX = mapX(frame.com.x);
              const comY = mapY(frame.com.y);
              ctx.beginPath();
              ctx.arc(comX, comY, 8, 0, 2 * Math.PI);
              ctx.fillStyle = frame.off_balance ? '#ef4444' : '#3b82f6';
              ctx.fill();
              ctx.lineWidth = 2;
              ctx.strokeStyle = '#ffffff';
              ctx.stroke();
              
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(comX - 4, comY - 1, 8, 2);
              ctx.fillRect(comX - 1, comY - 4, 2, 8);
            }
          }
          animationFrameId = requestAnimationFrame(drawOverlay);
        };
    
        animationFrameId = requestAnimationFrame(drawOverlay);
    
        return () => cancelAnimationFrame(animationFrameId);
      }, [showOverlay, showSkeleton, result, videoRef, canvasRef]);
}