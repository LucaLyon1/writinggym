"use client";

import { useState } from "react";
import { categories, passages, Passage, Category } from "@/data/passages";

type Props = {
    onSelect: (passage: Passage) => void;
};

export function PassageBrowser({ onSelect }: Props) {
    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const filtered =
        activeCategory === "all"
            ? passages
            : passages.filter((p) => p.categoryId === activeCategory);

    const activeCategoryData =
        activeCategory === "all"
            ? null
            : categories.find((c) => c.id === activeCategory);

    const countByCategory = (catId: string) =>
        passages.filter((p) => p.categoryId === catId).length;

    return (
        <div className="browser-root">
            {/* Header */}
            <header className="browser-header">
                <div className="browser-logo">
                    <span className="gym-logo-mark">✦</span>
                    <span className="gym-logo-text">Proselab</span>
                </div>
                <p className="browser-tagline">
                    Choose a passage. Train your ear.
                </p>
            </header>

            <div className="browser-body">
                {/* Sidebar */}
                <aside className="browser-sidebar">
                    <p className="sidebar-label">Categories</p>

                    <button
                        className={`cat-btn ${activeCategory === "all" ? "active" : ""}`}
                        onClick={() => setActiveCategory("all")}
                    >
                        <span className="cat-btn-label">All passages</span>
                        <span className="cat-btn-count">{passages.length}</span>
                    </button>

                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            <span className="cat-btn-label">{cat.label}</span>
                            <span className="cat-btn-count">{countByCategory(cat.id)}</span>
                        </button>
                    ))}
                </aside>

                {/* Main grid */}
                <main className="browser-main">
                    {activeCategoryData && (
                        <div className="category-header">
                            <h2 className="category-title">{activeCategoryData.label}</h2>
                            <p className="category-desc">{activeCategoryData.description}</p>
                        </div>
                    )}

                    <div className="passage-grid">
                        {filtered.map((passage) => {
                            const cat = categories.find((c) => c.id === passage.categoryId);
                            const isHovered = hoveredId === passage.id;
                            return (
                                <button
                                    key={passage.id}
                                    className={`passage-tile ${isHovered ? "hovered" : ""}`}
                                    onClick={() => onSelect(passage)}
                                    onMouseEnter={() => setHoveredId(passage.id)}
                                    onMouseLeave={() => setHoveredId(null)}
                                >
                                    {activeCategory === "all" && cat && (
                                        <span className="tile-category">{cat.label}</span>
                                    )}
                                    <div className="tile-author">{passage.author}</div>
                                    <h3 className="tile-title">{passage.title}</h3>
                                    <div className="tile-work">{passage.work}</div>
                                    <p className="tile-preview">{passage.text.slice(0, 100)}…</p>
                                    <div className="tile-footer">
                                        <span className="tile-twists">
                                            {passage.twists.length} constraints
                                        </span>
                                        <span className="tile-cta">Start →</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}