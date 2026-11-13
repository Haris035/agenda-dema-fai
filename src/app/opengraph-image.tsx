
import { ImageResponse } from "next/og";

export const alt = "Agenda DEMA FAI UIKA Bogor";
export const size = {
    width: 1200,
    height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "75px",
                    background:
                        "linear-gradient(135deg, #052e16 0%, #14532d 55%, #059669 100%)",
                    color: "white",
                    fontFamily: "Arial",
                    position: "relative",
                }}
            >
                {/* DEKORASI */}
                <div
                    style={{
                        position: "absolute",
                        right: -100,
                        top: -150,
                        width: 500,
                        height: 500,
                        borderRadius: 250,
                        background: "rgba(255,255,255,0.06)",
                    }}
                />

                {/* LOGO DAN IDENTITAS */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 22,
                        marginBottom: 45,
                    }}
                >
                    <img
                        src="https://demafaiuika.my.id/images/open-graph.jpg"
                        width="100"
                        height="100"
                        style={{
                            objectFit: "contain",
                            borderRadius: 20,
                            background: "white",
                            padding: 8,
                        }}
                    />

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                        }}
                    >
                        <div
                            style={{
                                fontSize: 27,
                                fontWeight: 800,
                                color: "#bbf7d0",
                            }}
                        >
                            DEMA FAI UIKA BOGOR
                        </div>

                        <div
                            style={{
                                fontSize: 19,
                                color: "#d1fae5",
                            }}
                        >
                            Dewan Eksekutif Mahasiswa
                        </div>
                    </div>
                </div>

                {/* JUDUL */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        fontSize: 82,
                        fontWeight: 900,
                        lineHeight: 1.05,
                        letterSpacing: "-3px",
                    }}
                >
                    <div>AGENDA</div>

                    <div style={{ color: "#86efac" }}>
                        DEMA FAI
                    </div>
                </div>

                {/* DESKRIPSI */}
                <div
                    style={{
                        marginTop: 28,
                        fontSize: 27,
                        color: "#e2e8f0",
                    }}
                >
                    Pusat Informasi Agenda dan Kegiatan Mahasiswa
                </div>

                {/* FOOTER */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "auto",
                        paddingTop: 25,
                        borderTop: "1px solid rgba(255,255,255,0.2)",
                        fontSize: 20,
                        color: "#bbf7d0",
                    }}
                >
                    <div>
                        Universitas Ibn Khaldun Bogor
                    </div>

                    <div>
                        demafaiuika.my.id
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
        }
    );
}
