"use client";
import { useState } from "react";

type LocationData = {
    latitude: number;
    longitude: number;
    accuracy: number;
};

export default function LocationPage() {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [error, setError] = useState<string>("");

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError("このブラウザは位置情報に対応していません");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                });

                setError("");
            },
            (error) => {
                setError("位置情報を取得できませんでした");
                console.error(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    return (
        <div>
            <h1>位置情報取得テスト</h1>

            <button onClick={getLocation}>現在地を取得</button>

            {location && (
                <div>
                    <p>緯度：{location.latitude}</p>
                    <p>経度：{location.longitude}</p>
                    <p>精度：{location.accuracy}m</p>
                </div>
            )}

            {error && <p>{error}</p>}
        </div>
    );
}