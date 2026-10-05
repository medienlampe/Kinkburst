import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import PracticeDetailModal from "./PracticeDetailModal";
import i18n from "../../i18n.tests";
import userEvent from "@testing-library/user-event";

// Mirrors how App.tsx uses the modal: the note draft is parent-controlled and
// reset when a field is opened.
interface HarnessProps {
  onSave: (note: string) => void,
  onCancel: () => void,
  onSelectStatus?: (value: number) => void,
  currentValue?: number | undefined,
}

const Harness = ({ onSave, onCancel, onSelectStatus = () => undefined, currentValue } : HarnessProps) => {
  const [note, setNote] = useState("existing context");

  return (
    <PracticeDetailModal
      isActive
      practiceName="Whip"
      note={note}
      onNoteChange={setNote}
      onSave={onSave}
      onCancel={onCancel}
      currentValue={currentValue}
      onSelectStatus={onSelectStatus} />
  );
};

const renderModal = (onSave: (note: string) => void, onCancel: () => void, extra: Partial<HarnessProps> = {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Harness onSave={onSave} onCancel={onCancel} {...extra} />
    </I18nextProvider>
  );
};

describe("PracticeDetailModal", () => {
  it("shows the practice name and its current note", () => {
    renderModal(() : void => {}, () : void => {});

    expect(screen.getByText("Whip")).toBeInTheDocument();
    expect(screen.getByLabelText("Context / notes")).toHaveValue("existing context");
  });

  it("saves the edited note (trimmed) when Save is clicked", async () => {
    const onSave = vi.fn();
    renderModal(onSave, () : void => {});

    await userEvent.type(screen.getByLabelText("Context / notes"), " more ");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith("existing context more");
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = vi.fn();
    renderModal(() : void => {}, onCancel);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe("PracticeDetailModal status picker", () => {
  it("offers one option per status and marks the current one", () => {
    renderModal(() : void => {}, () : void => {}, { currentValue: 3 });

    const options = screen.getAllByRole("button", { name: /Not Defined|Hard Limit|Soft Limit|Okay|Desired/ });
    expect(options).toHaveLength(5);

    expect(screen.getByRole("button", { name: "Okay" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hard Limit" })).toHaveAttribute("aria-pressed", "false");
  });

  it("calls onSelectStatus with the chosen status", () => {
    const onSelectStatus = vi.fn();
    renderModal(() : void => {}, () : void => {}, { onSelectStatus });

    fireEvent.click(screen.getByRole("button", { name: "Hard Limit" }));
    expect(onSelectStatus).toHaveBeenCalledTimes(1);
    expect(onSelectStatus).toHaveBeenCalledWith(1);
  });
});
