"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// اضافه کن در بالای کامپوننت
const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('trading_user') || '{}');
  return {
    'x-user-id': user.id?.toString() || '1'
  };
};

export default function Setups() {
  const [setups, setSetups] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingSetup, setEditingSetup] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeProfile, setActiveProfile] = useState(null);

  // State برای انتقال ستاپ‌ها
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedSetups, setSelectedSetups] = useState(new Set());
  const [targetProfileId, setTargetProfileId] = useState("");
  const [transferLoading, setTransferLoading] = useState(false);
  const [profilesList, setProfilesList] = useState([]);

  const [newSetup, setNewSetup] = useState({
    name: "",
    type: "normal",
    images: [],
    imagePreviews: [],
    description: "",
    rr: 1
  });

  // دریافت پروفایل فعال
  useEffect(() => {
    loadActiveProfile();
    loadSetups();
  }, []);

  const loadActiveProfile = async () => {
    try {
      const res = await fetch('/api/profiles');
      const data = await res.json();
      setActiveProfile(data.active);
    } catch (error) {
      console.error("Error loading active profile:", error);
    }
  };

  const loadSetups = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/setups', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch setups');
    const data = await res.json();
    const processedData = data.map(setup => ({
      ...setup,
      images: setup.images ? (typeof setup.images === 'string' ? JSON.parse(setup.images) : setup.images) : (setup.image ? [setup.image] : [])
    }));
    setSetups(processedData);
  } catch (error) {
    console.error('Error loading setups:', error);
  } finally {
    setLoading(false);
  }
};

 // دریافت لیست پروفایل‌ها برای انتقال
  const loadProfilesForTransfer = async () => {
    try {
      const res = await fetch('/api/profiles', {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      const otherProfiles = (data.profiles || []).filter(p => p.id !== activeProfile?.id);
      setProfilesList(otherProfiles);
    } catch (error) {
      console.error("Error loading profiles:", error);
    }
  };

  const saveSetup = async () => {
    if (!newSetup.name) {
      alert("Please enter setup name");
      return;
    }
    
    const setupToAdd = {
      name: newSetup.name,
      type: newSetup.type,
      images: JSON.stringify(newSetup.images),
      description: newSetup.description || null,
      rr: parseFloat(newSetup.rr) || 1
    };
    
 
    try {
      let res;
      if (isEditing && editingSetup) {
        res = await fetch(`/api/setups?id=${editingSetup.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(setupToAdd)
        });
      } else {
        res = await fetch('/api/setups', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify(setupToAdd)
        });
      }
      
      if (res.ok) {
        await loadSetups();
        setShowAddModal(false);
        resetForm();
      } else {
        alert('Error saving setup');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving setup');
    }
  };

const deleteSetup = async (id) => {
    if (!confirm('آیا مطمئن هستید؟ این ستاپ حذف خواهد شد.')) return;
    try {
      const res = await fetch(`/api/setups?id=${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await loadSetups();
        setShowDetailModal(null);
      } else {
        alert('Error deleting setup');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting setup');
    }
  };

 const updateSetupType = async (id, newType) => {
    try {
      const res = await fetch(`/api/setups?id=${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ type: newType })
      });
      
      if (res.ok) {
        await loadSetups();
      } else {
        alert('Error updating setup type');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating setup type');
    }
  };

  const resetForm = () => {
    setNewSetup({
      name: "",
      type: "normal",
      images: [],
      imagePreviews: [],
      description: "",
      rr: 1
    });
    setIsEditing(false);
    setEditingSetup(null);
  };

  const startEdit = (setup) => {
    setEditingSetup(setup);
    setNewSetup({
      name: setup.name,
      type: setup.type,
      images: setup.images || [],
      imagePreviews: setup.images || [],
      description: setup.description || "",
      rr: setup.rr || 1
    });
    setIsEditing(true);
    setShowDetailModal(null);
    setShowAddModal(true);
  };

  const handleImageUpload = (files) => {
    const fileArray = Array.from(files);
    const newImages = [...newSetup.images];
    const newPreviews = [...newSetup.imagePreviews];
    
    fileArray.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result);
        newPreviews.push(reader.result);
        setNewSetup({ ...newSetup, images: newImages, imagePreviews: newPreviews });
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = [...newSetup.images];
    const newPreviews = [...newSetup.imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setNewSetup({ ...newSetup, images: newImages, imagePreviews: newPreviews });
  };

const handleCopy = async () => {
  if (selectedSetups.size === 0) {
    alert("لطفاً حداقل یک ستاپ را انتخاب کنید");
    return;
  }
  if (!targetProfileId) {
    alert("لطفاً پروفایل مقصد را انتخاب کنید");
    return;
  }
  
   setTransferLoading(true);
    try {
      const res = await fetch('/api/setups/copy', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          setupIds: Array.from(selectedSetups),
          targetProfileId: parseInt(targetProfileId)
        })
      });
    
    const data = await res.json();
    
    if (res.ok) {
      let message = data.message;
      if (data.duplicateCount > 0) {
        message += `\n\n⚠️ ستاپ‌های تکراری (کپی نشدند):\n${data.duplicateNames.map(n => `• ${n}`).join('\n')}`;
      }
      alert(message);
      setShowTransferModal(false);
      setSelectedSetups(new Set());
      setTargetProfileId("");
      await loadSetups();
    } else {
      alert(data.error || "خطا در کپی ستاپ‌ها");
    }
  } catch (error) {
    console.error("Error copying setups:", error);
    alert("خطا در کپی ستاپ‌ها");
  } finally {
    setTransferLoading(false);
  }
};

  const openImageGallery = (images, startIndex = 0) => {
    setSelectedImage(images);
    setCurrentImageIndex(startIndex);
    setShowImageModal(true);
  };

  const nextImage = () => {
    if (selectedImage && Array.isArray(selectedImage)) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedImage.length);
    }
  };

  const prevImage = () => {
    if (selectedImage && Array.isArray(selectedImage)) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedImage.length) % selectedImage.length);
    }
  };

  if (loading) {
    return (
      <div className="col-span-3 flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading setups...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-3">
      {/* Header پریمیوم */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-purple-500/10 border border-white/10 p-6 mb-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 via-sky-400 to-purple-400 bg-clip-text text-transparent">
              📸 Setup Library
            </h1>
            <p className="text-gray-400 text-sm mt-1">Manage your trading setups</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                loadProfilesForTransfer();
                setShowTransferModal(true);
              }}
              className="bg-gradient-to-r from-sky-500 to-sky-600 text-white px-4 py-3 rounded-xl font-semibold shadow-lg shadow-sky-500/25"
            >
              📦 انتقال ستاپ
            </Button>
            <Button 
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-500/25"
            >
              + New Setup
            </Button>
          </div>
        </div>
      </div>

      {/* لیست ستاپ‌ها */}
      <div className="grid grid-cols-2 gap-4">
        {setups.length === 0 ? (
          <div className="col-span-2 text-center py-16">
            <div className="text-6xl mb-4 opacity-50">📭</div>
            <p className="text-gray-400">No setups created yet</p>
            <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white mt-4 rounded-xl shadow-lg shadow-emerald-500/25">
              Create your first setup
            </Button>
          </div>
        ) : (
          setups.map((setup, idx) => (
            <div
              key={setup.id}
              onClick={() => setShowDetailModal(setup)}
              className="bg-gradient-to-br from-white/5 to-transparent rounded-2xl overflow-hidden outline outline-1 outline-white/10 cursor-pointer transition-all duration-200 hover:outline-emerald-500/50"
            >
              {setup.images && setup.images.length > 0 && (
                <div className="h-40 overflow-hidden relative group">
                  <img 
                    src={setup.images[0]} 
                    alt={setup.name} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {setup.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      +{setup.images.length - 1} more
                    </div>
                  )}
                </div>
              )}
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{setup.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    setup.type === 'aplus' 
                      ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 text-yellow-400 outline outline-1 outline-yellow-500/30" 
                      : "bg-gradient-to-r from-sky-500/20 to-sky-600/10 text-sky-400 outline outline-1 outline-sky-500/30"
                  }`}>
                    {setup.type === 'aplus' ? '⭐ A+ Setup' : '📘 Normal'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-2 mb-3">{setup.description || "No description"}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300 outline outline-1 outline-white/10">
                      R:R {setup.rr}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(setup);
                      }}
                      className="text-xs px-2 py-1 rounded-full bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const newType = setup.type === 'aplus' ? 'normal' : 'aplus';
                        updateSetupType(setup.id, newType);
                      }}
                      className={`text-xs px-2 py-1 rounded-full transition-all duration-200 ${
                        setup.type === 'aplus' 
                          ? "bg-white/10 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400" 
                          : "bg-white/10 text-gray-400 hover:bg-yellow-500/20 hover:text-yellow-400"
                      }`}
                    >
                      {setup.type === 'aplus' ? 'Remove A+ ⭐' : 'Mark as A+ ⭐'}
                    </button>
                  </div>
                </div>
              </CardContent>
            </div>
          ))
        )}
      </div>

      {/* مودال انتقال ستاپ‌ها */}
      <AnimatePresence>
        {showTransferModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                        <span className="text-sm">📦</span>
                      </div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-400 bg-clip-text text-transparent">
                        انتقال ستاپ‌ها
                      </h2>
                    </div>
                    <button onClick={() => setShowTransferModal(false)} className="text-gray-400 hover:text-white text-xl">✕</button>
                  </div>
                  
                  <div className="space-y-6" style={{ direction: "rtl", textAlign: "right" }}>
                    
                    {/* انتخاب ستاپ‌ها */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <label className="block text-sm text-gray-400 mb-3">
                        📋 ستاپ‌های قابل انتقال ({setups.length} عدد)
                      </label>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {setups.map(setup => (
                          <div key={setup.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedSetups.has(setup.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedSetups);
                                if (e.target.checked) {
                                  newSelected.add(setup.id);
                                } else {
                                  newSelected.delete(setup.id);
                                }
                                setSelectedSetups(newSelected);
                              }}
                              className="w-4 h-4 rounded border-gray-500 text-sky-500 focus:ring-sky-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-white">{setup.name}</div>
                              <div className="text-xs text-gray-500">
                                نوع: {setup.type === 'aplus' ? '⭐ A+' : '📘 Normal'} | R:R {setup.rr}
                              </div>
                            </div>
                            {setup.images && setup.images[0] && (
                              <img src={setup.images[0]} alt={setup.name} className="w-10 h-10 rounded-lg object-cover" />
                            )}
                          </div>
                        ))}
                        {setups.length === 0 && (
                          <div className="text-center py-8">
                            <div className="text-5xl mb-2 opacity-50">📭</div>
                            <p className="text-sm text-gray-500">هیچ ستاپی برای انتقال وجود ندارد</p>
                          </div>
                        )}
                      </div>
                      {setups.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => {
                              const allIds = new Set(setups.map(s => s.id));
                              setSelectedSetups(allIds);
                            }}
                            className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
                          >
                            انتخاب همه
                          </button>
                          <button
                            onClick={() => setSelectedSetups(new Set())}
                            className="text-xs px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300"
                          >
                            لغو انتخاب
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* انتخاب پروفایل مقصد */}
                    {profilesList.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <label className="block text-sm text-gray-400 mb-3">🎯 انتقال به پروفایل:</label>
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
    <p className="text-xs text-amber-400 flex items-center gap-2">
      <span>⚠️</span> توجه: اگر ستاپی با همین نام در پروفایل مقصد وجود داشته باشد، کپی نمی‌شود
    </p>
  </div>

                        <div className="space-y-2">
                          {profilesList.map(profile => (
                            <label key={profile.id} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                              <input
                                type="radio"
                                name="targetProfile"
                                value={profile.id}
                                checked={targetProfileId === profile.id}
                                onChange={(e) => setTargetProfileId(e.target.value)}
                                className="w-4 h-4 text-sky-500 focus:ring-sky-500"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-white">{profile.name}</div>
                                <div className="text-xs text-gray-500">سرمایه: ${profile.current_capital?.toFixed(2)}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profilesList.length === 0 && (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                        <p className="text-sm text-amber-400">⚠️ پروفایل دیگری برای انتقال وجود ندارد</p>
                        <p className="text-xs text-gray-500 mt-1">ابتدا یک پروفایل جدید ایجاد کنید</p>
                      </div>
                    )}
                    
                    {/* دکمه‌های اقدام */}
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={() => setShowTransferModal(false)}
                        className="flex-1 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 transition-all"
                      >
                        انصراف
                      </button>
                      <button
  onClick={handleCopy}
  disabled={transferLoading || selectedSetups.size === 0 || !targetProfileId}
  className={`flex-1 py-2 rounded-xl font-semibold transition-all ${
    transferLoading || selectedSetups.size === 0 || !targetProfileId
      ? "bg-gray-600/50 cursor-not-allowed text-gray-400"
      : "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/25 hover:scale-[1.02]"
  }`}
>
  {transferLoading ? "در حال کپی..." : `کپی ${selectedSetups.size} ستاپ`}
</button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال افزودن/ویرایش ستاپ */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* محتوای مودال افزودن/ویرایش (همان کد قبلی) */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl" />
                <CardContent className="p-6 relative z-10">
                  <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    {isEditing ? "✏️ Edit Setup" : "➕ New Setup"}
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📌 Setup Name</label>
                      <input 
                        type="text"
                        placeholder="e.g., Breakout Pattern"
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50"
                        value={newSetup.name}
                        onChange={(e) => setNewSetup({...newSetup, name: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">🏷️ Setup Type</label>
                      <select
                        value={newSetup.type}
                        onChange={(e) => setNewSetup({...newSetup, type: e.target.value})}
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white outline outline-1 outline-white/10 focus:outline-emerald-500/50"
                      >
                        <option value="normal">📘 Normal Setup</option>
                        <option value="aplus">⭐ A+ Setup</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📸 Setup Images</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        multiple
                        onChange={(e) => handleImageUpload(e.target.files)}
                        className="w-full bg-zinc-800 p-2 rounded-xl text-white"
                      />
                      {newSetup.imagePreviews.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {newSetup.imagePreviews.map((img, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                              <img src={img} alt="preview" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeImage(idx)}
                                className="absolute top-0 right-0 bg-red-500 text-white text-xs w-4 h-4 rounded-full"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📝 Description</label>
                      <textarea 
                        rows="3"
                        placeholder="Setup description..."
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white"
                        value={newSetup.description}
                        onChange={(e) => setNewSetup({...newSetup, description: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">📊 Risk to Reward (R:R)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        className="w-full bg-zinc-800 p-3 rounded-xl text-white"
                        value={newSetup.rr}
                        onChange={(e) => setNewSetup({...newSetup, rr: parseFloat(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <Button onClick={() => setShowAddModal(false)} className="bg-white/5 hover:bg-white/10 flex-1 rounded-xl text-gray-300">
                      Cancel
                    </Button>
                    <Button onClick={saveSetup} className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex-1 rounded-xl font-semibold">
                      {isEditing ? "Save Changes" : "Save Setup"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال جزئیات ستاپ */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDetailModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 rounded-2xl">
                {showDetailModal.images && showDetailModal.images.length > 0 && (
                  <div className="relative bg-black/50">
                    <img 
                      src={showDetailModal.images[currentImageIndex]} 
                      alt={showDetailModal.name} 
                      className="w-full h-64 object-contain cursor-pointer"
                      onClick={() => openImageGallery(showDetailModal.images, currentImageIndex)}
                    />
                    {showDetailModal.images.length > 1 && (
                      <>
                        <button onClick={prevImage} className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full">◀</button>
                        <button onClick={nextImage} className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-8 h-8 rounded-full">▶</button>
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                          {currentImageIndex + 1} / {showDetailModal.images.length}
                        </div>
                      </>
                    )}
                    <button onClick={() => setShowDetailModal(null)} className="absolute top-2 right-2 bg-black/50 rounded-full w-8 h-8 flex items-center justify-center text-white">✕</button>
                  </div>
                )}
                
                <CardContent className="p-6" style={{ direction: "rtl", textAlign: "right" }}>
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-white">{showDetailModal.name}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full ${showDetailModal.type === 'aplus' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-sky-500/20 text-sky-400'}`}>
                      {showDetailModal.type === 'aplus' ? '⭐ A+ Setup' : '📘 Normal'}
                    </span>
                  </div>
                  
                  {showDetailModal.description && (
                    <div className="p-4 bg-white/5 rounded-xl mb-4">
                      <p className="text-gray-300 text-sm">{showDetailModal.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-400 text-xs mb-1">نسبت R:R</p>
                      <p className="text-xl font-bold text-sky-400">{showDetailModal.rr || 1}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-xl text-center">
                      <p className="text-gray-400 text-xs mb-1">نوع</p>
                      <p className="text-xl font-bold text-yellow-400">{showDetailModal.type === 'aplus' ? 'A+' : 'Normal'}</p>
                    </div>
                  </div>
                  
                  {showDetailModal.stats && showDetailModal.stats.totalTrades > 0 ? (
                    <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 rounded-xl">
                      <h4 className="text-sm font-semibold text-emerald-400 mb-3">📊 عملکرد این ستاپ</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-xs text-gray-400">تعداد تریدها</p>
                          <p className="text-lg font-bold text-white">{showDetailModal.stats.totalTrades}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400">وین ریت</p>
                          <p className={`text-lg font-bold ${showDetailModal.stats.winRate >= 50 ? "text-emerald-400" : "text-rose-400"}`}>
                            {showDetailModal.stats.winRate}%
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 rounded-xl text-center">
                      <p className="text-xs text-gray-400">هنوز تریدی با این ستاپ ثبت نشده است.</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => setShowDetailModal(null)} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600">بستن</Button>
                    <Button onClick={() => startEdit(showDetailModal)} className="flex-1 bg-gradient-to-r from-sky-500 to-sky-600">✏️ ویرایش</Button>
                    <Button onClick={() => deleteSetup(showDetailModal.id)} className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600">🗑️ حذف</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* مودال بزرگنمایی عکس */}
      <AnimatePresence>
        {showImageModal && selectedImage && Array.isArray(selectedImage) && (
          <motion.div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImageModal(false)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <img src={selectedImage[currentImageIndex]} alt="large" className="max-w-full max-h-[90vh] rounded-2xl object-contain" />
              {selectedImage.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full text-xl">◀</button>
                  <button onClick={nextImage} className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full text-xl">▶</button>
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {selectedImage.length}
                  </div>
                </>
              )}
              <button onClick={() => setShowImageModal(false)} className="absolute -top-4 -right-4 bg-rose-600 text-white w-10 h-10 rounded-full text-xl hover:bg-rose-700">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}