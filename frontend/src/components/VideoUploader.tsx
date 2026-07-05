import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileWarning } from "lucide-react"

interface VideoUploaderProps {
    onVideoSelected: (file: File) => void;
}

export default function VideoUploader({ onVideoSelected }: VideoUploaderProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onVideoSelected(acceptedFiles[0]);
        }
    }, [onVideoSelected]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            "video/*": [".mp4", ".mov", ".avi"]
        },
        maxFiles: 1
    });

    return (
        <div
            {...getRootProps()}
            className={`
                border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center
                ${isDragActive ? "border-ocean-500 bg-white shadow-lg" : "border-rock-300 bg-sand-200/30 hover:bg-sand-200/70"}
            `}
        >
            <input {...getInputProps()} />
            {isDragReject ? (
                <>
                    <FileWarning size={48} className="mb-4 text-red-500" />
                    <p className="text-red-500 font-bold">To nie jest plik wideo!</p>
                </>
            ) : (
                <>
                    <UploadCloud
                        size={48}
                        className={`mb-4 transition-colors ${isDragActive ? "text-ocean-500" : "text-rock-300"}`}
                    />
                    {isDragActive ? (
                        <p className="text-ocean-500 font-bold">Upuść nagranie tutaj...</p>
                    ) : (
                        <div>
                            <p className="font-bold text-lg mb-2 text-rock-800">
                                Przeciągnij i upuść wideo z przejścia
                            </p>
                            <p className="text-rock-800/70 text-sm m-0">
                                lub kliknij, aby wybrać plik (.mp4, .mov, .avi)
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}